import {
  Avatar,
  FilledVariant,
  Icon,
  IconButton,
  Tooltip,
  TooltipContent,
  TooltipPlacement,
  TooltipTrigger,
  Type,
  Typography
} from '@skiff-org/skiff-ui';
import React, { useEffect, useState } from 'react';
import { abbreviateWalletAddress, splitEmailToAliasAndDomain, TitleActionSection } from 'skiff-front-utils';
import styled from 'styled-components';
import isEthereumAddress from 'validator/lib/isEthereumAddress';

import { getENSNameFromEthAddr } from '../../../../utils/metamaskUtils';

const ENSAliasRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const ENSAliasEmails = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  align-items: center;
`;

interface ENSAliasProps {
  walletAliases: string[];
}

interface ENSAliasInfo {
  walletAlias: string;
  mailDomain: string;
}

interface ENSAliasDict {
  [ensName: string]: ENSAliasInfo;
}

/**
 * Component for rendering the interface for ENS aliases.
 */
export const ENSAlias: React.FC<ENSAliasProps> = ({ walletAliases }) => {
  const [ensAliases, setENSAliases] = useState<ENSAliasDict>({});

  useEffect(() => {
    const getENSAliases = async () => {
      const ensEmailAliases = {} as ENSAliasDict;
      await Promise.all(
        walletAliases.map(async (email) => {
          const { alias, domain: mailDomain } = splitEmailToAliasAndDomain(email);
          if (!!alias && isEthereumAddress(alias)) {
            const ensName = await getENSNameFromEthAddr(alias);
            if (!ensName) return;
            if (!(ensName in ensEmailAliases) && mailDomain) {
              ensEmailAliases[ensName] = { walletAlias: alias, mailDomain };
            }
          }
        })
      );
      setENSAliases(ensEmailAliases);
    };

    void getENSAliases();
  }, [walletAliases]);

  const viewOnENS = (ensName: string) => {
    if (ensName.length && window) {
      window.open(`https://app.ens.domains/name/${ensName}/details`, '_blank');
    }
  };

  const openENS = () => {
    if (window) window.open('https://app.ens.domains/', '_blank');
  };

  return (
    <>
      <TitleActionSection
        actions={[
          {
            onClick: openENS,
            label: 'Add ENS',
            type: 'button'
          }
        ]}
        subtitle='Send and receive email from your ENS name'
        title='ENS aliases'
      />
      {!!Object.keys(ensAliases).length &&
        Object.entries(ensAliases).map(([ensAlias, ensAliasInfo]) => {
          const { walletAlias, mailDomain } = ensAliasInfo;
          return (
            <ENSAliasRow key={ensAlias}>
              <ENSAliasEmails>
                <Avatar label={ensAlias} />
                <div>
                  <Typography mono uppercase>
                    {ensAlias}
                  </Typography>
                  <Tooltip placement={TooltipPlacement.RIGHT}>
                    <TooltipContent>{`${walletAlias}@${mailDomain}`}</TooltipContent>
                    <TooltipTrigger>
                      <Typography mono uppercase color='secondary'>
                        {`${abbreviateWalletAddress(walletAlias)}@${mailDomain}`}
                      </Typography>
                    </TooltipTrigger>
                  </Tooltip>
                </div>
              </ENSAliasEmails>
              <div>
                <IconButton
                  icon={Icon.ExternalLink}
                  onClick={() => viewOnENS(ensAlias)}
                  tooltip='View on ENS'
                  type={Type.SECONDARY}
                  variant={FilledVariant.UNFILLED}
                />
              </div>
            </ENSAliasRow>
          );
        })}
    </>
  );
};
