import dayjs from 'dayjs';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import { encryptDatagramV2, generateSymmetricKey, stringEncryptAsymmetric } from 'skiff-crypto';
import { EncryptedContactDataDatagram, ValueLabel, models } from 'skiff-front-graphql';
import { v4 } from 'uuid';

import { CsvRowData, ReturnedCsvData, VcfKeyData } from './Contacts.types';

const formatBirthday = (birthdayVal?: string) => {
  if (!birthdayVal) {
    return '';
  }
  // dates on export are always in YYYY-MM-DD format
  // is valid date
  const isValidDate = dayjs(birthdayVal).isValid();
  return isValidDate ? birthdayVal : '';
};

export const getPhoneWithoutSpaces = (phoneNumber: string | undefined) => {
  if (!phoneNumber) return '';
  return phoneNumber?.replace(/\s/g, '');
};

const extractPhoneNumbersFromCsv = (record: Record<string, string | undefined>): ValueLabel[] => {
  // Define base labels and their display labels
  const baseLabels = {
    'Primary Phone': 'Primary',
    'Other Phone': 'Other',
    'Home Phone': 'Home',
    'Work Phone': 'Work',
    'Mobile Phone': 'Mobile'
  };

  // Process base labels
  const phoneNumbers: ValueLabel[] = Object.entries(baseLabels)
    .filter(([key]) => record[key] !== undefined)
    .map(([key, displayLabel]) => ({
      value: getPhoneWithoutSpaces(record[key]) || '',
      label: displayLabel
    }));

  // Handle 'Phone x - Value' where x >= 1
  let index = 1;
  while (record[`Phone ${index} - Value`] !== undefined) {
    phoneNumbers.push({
      value: getPhoneWithoutSpaces(record[`Phone ${index} - Value`]) || '', // value will never fallback to empty string
      label: record[`Phone ${index} - Type`] || ''
    });
    index++;
  }

  // Handle Home Phone y, Work Phone y, and Mobile Phone y where y >= 2
  ['Home', 'Work', 'Mobile'].forEach((base) => {
    let idx = 2;
    while (record[`${base} Phone ${idx}`] !== undefined) {
      phoneNumbers.push({
        value: getPhoneWithoutSpaces(record[`${base} Phone ${idx}`]) || '',
        label: `${base} ${idx}`
      });
      idx++;
    }
  });

  return phoneNumbers;
};

const extractAddressesFromCsv = (record: Record<string, string | undefined>): ValueLabel[] => {
  const addresses: ValueLabel[] = [];

  // Extract Google CSV formatted addresses
  for (let i = 1; i <= 10; i++) {
    // assuming a maximum of 10 addresses
    const formattedAddress = record[`Address ${i} - Formatted`];
    const fallbackType = i > 1 ? `Address ${i}` : '';
    if (formattedAddress) {
      addresses.push({
        value: formattedAddress,
        label: record[`Address ${i} - Type`] || fallbackType
      });
    }
  }

  // Extract Outlook CSV formatted addresses
  const outlookAddressTypes = ['Home', 'Business', 'Other'];
  for (const type of outlookAddressTypes) {
    const formattedAddress = record[`${type} Address`];
    if (formattedAddress) {
      addresses.push({
        value: formattedAddress,
        label: type
      });
    }
  }

  return addresses;
};

export const importContactCsvFile = async (
  file: File,
  userData: models.User,
  createOrUpdateContact: any,
  onCompleted: () => void
) => {
  const parseCSV = async (): Promise<ReturnedCsvData> => {
    const Papa = await import('papaparse');
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (result: ReturnedCsvData) => {
          resolve(result);
        },
        header: true,
        skipEmptyLines: true,
        error: (error: any) => {
          reject(error);
        }
      });
    });
  };

  try {
    const result = await parseCSV();
    const records = result.data;

    records.forEach((contactRecord) => {
      // convert all '' fields to undefined
      const record = Object.fromEntries(
        Object.entries(contactRecord).map(([key, value]) => [key, value === '' ? undefined : value])
      ) as CsvRowData;

      let firstName = record['First Name'] ?? record['Given Name'] ?? '';
      let lastName = record['Last Name'] ?? record['Family Name'] ?? '';
      if (!firstName && !lastName) {
        const name = record.Name;
        if (name) {
          const nameSplit = name.split(' ');
          firstName = nameSplit[0];
          lastName = nameSplit[1];
        }
      }

      const email = record.Email ?? record['E-mail 1 - Value'] ?? record['E-mail Address'];
      const birthday = formatBirthday(record.Birthday);
      const phoneNumbers = extractPhoneNumbersFromCsv(record);
      const note = record.Note ?? record.Notes;
      const company = record['Organization 1 - Name'] ?? '';
      const title = record['Organization 1 - Title'] ?? '';
      const addresses = extractAddressesFromCsv(record);
      const nickname = record.Nickname ?? '';
      const url = record['Website 1 - Value'] ?? '';
      try {
        const decryptedData = {
          decryptedBirthday: isString(birthday) && !isNaN(Date.parse(birthday)) ? birthday : '',
          decryptedNotes: isString(note) ? note : '',
          decryptedPhoneNumbers: phoneNumbers,
          decryptedPhoneNumber: '',
          decryptedCompany: company,
          decryptedJobTitle: title,
          decryptedAddress: '',
          decryptedAddresses: addresses,
          decryptedNickname: nickname,
          decryptedURL: url
        };
        const contactSessionKey = generateSymmetricKey();
        const contactEncryptedData = encryptDatagramV2(
          EncryptedContactDataDatagram,
          {},
          decryptedData,
          contactSessionKey
        );
        const encryptedKey = stringEncryptAsymmetric(
          userData.privateUserData.privateKey || '',
          userData.publicKey,
          contactSessionKey
        );

        void createOrUpdateContact({
          variables: {
            request: {
              contactID: v4(),
              emailAddress: email,
              firstName,
              lastName,
              displayPictureData: undefined,
              encryptedByKey: userData.publicKey.key,
              encryptedSessionKey: encryptedKey,
              encryptedContactData: contactEncryptedData.encryptedData
            }
          },
          onCompleted
        });
      } catch (error) {
        console.error('Could not read contact', error);
      }
    });
  } catch (error) {
    console.error('Error parsing CSV file:', error);
  }
};

export const importContactVcfFile = async (
  file: File,
  userData: models.User,
  createOrUpdateContact: any,
  onCompleted: () => void
) => {
  const vCard = await import('vcf');

  /**
   *
   * The function processes the keys and maps them to a value-label format.
   * If the key is a phone number then it can look for the type in the xAB Labels
   */
  const processMultipleFieldsKeys = (
    keys: VcfKeyData[] | string,
    xABLabels: VcfKeyData[],
    isPhone = false
  ): ValueLabel[] => {
    if (typeof keys === 'string') {
      return [{ value: keys, label: isPhone && xABLabels?.length ? xABLabels[0]._data ?? '' : '' }];
    }

    return keys.map(({ _data, type, group }: VcfKeyData) => {
      let label = type;

      if (isPhone && !type && group) {
        const extractedLabel = xABLabels.find((xABLabel) => xABLabel.group === group);
        label = extractedLabel?._data || '';
      }

      // If there are multiple labels for the same field, we add them in a string separated by comma
      if (label && Array.isArray(label)) {
        label = label.join(', ');
      }

      return {
        value: _data ? (isPhone ? getPhoneWithoutSpaces(_data) : _data) : '',
        label: label || ''
      };
    });
  };

  const tryToCreateContactGivenVcard = (cards: ReturnType<typeof vCard.default.parse>) => {
    for (const card of cards) {
      try {
        const name = card.get('fn');
        const emailProp = card.get('email');
        if (name) {
          const emailPropToRead = emailProp instanceof Array ? emailProp[0] : emailProp;
          const nameToRead = name instanceof Array ? name[0] : name;
          const nameValue = nameToRead.valueOf();
          const emailValue = emailPropToRead?.valueOf();
          const [firstName, lastName] = nameValue.toString().split(' ');
          const note = card.get('note')?.valueOf();
          // company/job title
          const company = card.get('org')?.valueOf();
          const title = card.get('title')?.valueOf();
          const birthday = card.get('bday')?.valueOf();

          // Extract xAB Labels as they are used as Phone Labels in iOS and ensure they are in an array format
          const extractedxABLabels = card.data.xAbLabel;
          let xABLabels = extractedxABLabels as VcfKeyData[];
          if (!isArray(extractedxABLabels) && extractedxABLabels) {
            xABLabels = [extractedxABLabels as VcfKeyData];
          }

          const phoneKeys: VcfKeyData[] | string = card.get('tel')?.valueOf() as VcfKeyData[] | string;
          const phoneNumbers: ValueLabel[] = phoneKeys ? processMultipleFieldsKeys(phoneKeys, xABLabels, true) : [];

          const addressesKeys: VcfKeyData[] | string = card.get('adr')?.valueOf() as VcfKeyData[] | string;
          const addresses: ValueLabel[] = addressesKeys ? processMultipleFieldsKeys(addressesKeys, xABLabels) : [];

          const nickname = card.get('nickname')?.valueOf();
          const url = card.get('URL')?.valueOf();

          const decryptedData = {
            decryptedBirthday: isString(birthday) ? formatBirthday(birthday) : '',
            decryptedNotes: isString(note) ? note : '',
            decryptedPhoneNumber: '',
            decryptedPhoneNumbers: phoneNumbers,
            decryptedCompany: isString(company) ? company : '',
            decryptedJobTitle: isString(title) ? title : '',
            decryptedAddresses: addresses,
            decryptedAddress: '',
            decryptedNickname: isString(nickname) ? nickname : '',
            decryptedURL: isString(url) ? url : ''
          };
          const contactSessionKey = generateSymmetricKey();
          const contactEncryptedData = encryptDatagramV2(
            EncryptedContactDataDatagram,
            {},
            decryptedData,
            contactSessionKey
          );
          const encryptedKey = stringEncryptAsymmetric(
            userData.privateUserData.privateKey || '',
            userData.publicKey,
            contactSessionKey
          );

          void createOrUpdateContact({
            variables: {
              request: {
                contactID: v4(),
                emailAddress: emailValue,
                firstName: firstName ?? '',
                lastName: lastName ?? '',
                displayPictureData: undefined,
                encryptedByKey: userData.publicKey.key,
                encryptedSessionKey: encryptedKey,
                encryptedContactData: contactEncryptedData.encryptedData
              }
            },
            onCompleted
          });
        }
      } catch (error) {
        console.error('Could not read contact', error);
      }
    }
  };

  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = (e) => {
    const text = e.target?.result;
    if (text && typeof text === 'string') {
      try {
        // try without any parsing
        const cards = vCard.default.parse(text);
        void tryToCreateContactGivenVcard(cards);
      } catch (error) {
        // try to split into multiple vcards
        const textSplitByDoubleNewlines = text.split('\n\n');
        for (const textSplit of textSplitByDoubleNewlines) {
          // replace all newlines with \r\n
          const textToParse = textSplit.replace(/\n/g, '\r\n');
          try {
            const card = vCard.default.parse(textToParse);
            void tryToCreateContactGivenVcard(card);
          } catch (parseErr) {
            console.log('Could not parse formatted vcard', parseErr);
          }
        }
      }
    }
  };
};

export const handleContactImport = async (
  files: Array<File> | FileList | null,
  setIsImporting: React.Dispatch<boolean>,
  enqueueToast: (toast: { title: string }) => void,
  userData: models.User,
  createOrUpdateContact: any,
  debouncedRefresh: () => void
) => {
  if (files && files.length) {
    setIsImporting(true);

    const promises = Array.from(files)
      .map((file) => {
        if (file.name.endsWith('.vcf')) {
          return importContactVcfFile(file, userData, createOrUpdateContact, debouncedRefresh);
        } else if (file.name.endsWith('.csv')) {
          return importContactCsvFile(file, userData, createOrUpdateContact, debouncedRefresh);
        }
        return null;
      })
      .filter(Boolean); // Remove any null values from the array

    try {
      enqueueToast({ title: 'Contacts importing' });
      await Promise.all(promises);
    } catch (error) {
      console.error('Error during contact import', error);
      // You might want to handle this error, e.g., show a toast message about the failure.
      setIsImporting(false);
    } finally {
      setIsImporting(false);
    }
  }
};
