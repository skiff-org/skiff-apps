import { QueryHookOptions } from '@apollo/client';
import { ApolloError } from '@apollo/client/core';
import { Contact, Exact, GetAllCurrentUserContactsQuery, useGetAllCurrentUserContactsQuery } from 'skiff-front-graphql';

import useCurrentOrganization from './useCurrentOrganization';
import { useGetOrgMemberDefaultEmailAliases } from './useGetOrgMemberDefaultEmailAlias';

type GetAllCurrentUserContactsQueryOptions =
  | QueryHookOptions<GetAllCurrentUserContactsQuery, Exact<{ [key: string]: never }>>
  | undefined;

export type OrgMemberContact = Contact & { isOrgMember: boolean };

export const isOrgMemberContact = (contact: Contact | OrgMemberContact): contact is OrgMemberContact => {
  return (contact as OrgMemberContact).isOrgMember === true;
};

interface UseGetAllContactsWithOrgMembersResponse {
  contactsWithOrgMembers: (Contact | OrgMemberContact)[];
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => void;
}

const useGetAllContactsWithOrgMembers = (
  queryOptions?: GetAllCurrentUserContactsQueryOptions
): UseGetAllContactsWithOrgMembersResponse => {
  const {
    data,
    loading: contactsLoading,
    error: getContactsError,
    refetch: refetchContacts
  } = useGetAllCurrentUserContactsQuery(queryOptions);

  const baseContacts = data?.allContacts ?? [];

  const { data: orgData, loading: loadingOrg, error: getOrgError, refetch: refetchOrg } = useCurrentOrganization();

  if (getOrgError) {
    console.error('Failed to retrieve organization data');
  }

  const organization = orgData?.organization;
  // every member of org is a collaborator on everyone team root doc
  const allOrgMembers = organization?.everyoneTeam?.rootDocument?.collaborators ?? [];

  const orgMemberUserIDsAndUsernames: { userID: string; username: string }[] = allOrgMembers.map(({ user }) => ({
    userID: user.userID,
    username: user.username
  }));

  const { defaultEmailAliases, loading: loadingDefaultAliases } =
    useGetOrgMemberDefaultEmailAliases(orgMemberUserIDsAndUsernames);

  const orgMembersAsContacts: OrgMemberContact[] = allOrgMembers
    .map(({ user }) => {
      const { publicData } = user;
      const [firstName, lastName] = publicData?.displayName?.split(' ') ?? [undefined, undefined];
      const displayPictureData = publicData?.displayPictureData
        ? {
            profileAccentColor: publicData?.displayPictureData.profileAccentColor,
            profileCustomURI: publicData?.displayPictureData.profileCustomURI,
            profileIcon: publicData?.displayPictureData.profileIcon
          }
        : undefined;

      return {
        emailAddress: defaultEmailAliases[user.userID],
        // Return undefined if they're empty strings
        firstName: !!firstName ? firstName : undefined,
        lastName: !!lastName ? lastName : undefined,
        displayPictureData,
        isOrgMember: true
      };
    })
    // In case of a failure retrieving the default email alias, filter out the contact
    .filter((orgContact) => !!orgContact.emailAddress);

  /**
   * If contact exists in orgMember, mark them as orgMember
   * Then filter out base contacts that are already in org members AND have no data filled in
   */
  const filteredBaseContacts = baseContacts
    .map((baseContact) => {
      const orgMemberContact = orgMembersAsContacts.find(
        (orgContact) => orgContact.emailAddress === baseContact.emailAddress
      );

      // Filter out base contacts that are already in org members AND have no data filled in (undefined removed below)
      if (!!orgMemberContact && !baseContact.firstName && !baseContact.lastName && !baseContact.displayPictureData)
        return undefined;

      return !!orgMemberContact
        ? {
            ...baseContact,
            isOrgMember: true
          }
        : baseContact;
    })
    .filter((contact): contact is Contact | OrgMemberContact => !!contact);

  /**
   * Filter out org contacts that are now resolved to base contacts
   */
  const filteredOrgContacts = orgMembersAsContacts.filter(
    (orgContact) => !filteredBaseContacts.some((baseContact) => baseContact.emailAddress === orgContact.emailAddress)
  );

  const loading = contactsLoading || loadingDefaultAliases || loadingOrg;

  const contacts = !loading ? [...filteredBaseContacts, ...filteredOrgContacts] : [];

  const refetch = () => {
    void refetchContacts();
    void refetchOrg();
  };

  return {
    contactsWithOrgMembers: contacts,
    loading,
    error: getContactsError,
    refetch
  };
};

export default useGetAllContactsWithOrgMembers;
