import { ExternalEmailClientLabel, ExternalEmailClientLabelFragment } from 'skiff-front-graphql';

export interface ExternalLabelsAndFoldersResult {
  externalLabels?: ExternalEmailClientLabelFragment[];
  externalFolders?: ExternalEmailClientLabelFragment[];
}

export interface ExternalItem {
  id: ExternalEmailClientLabel['labelID'];
  name: ExternalEmailClientLabel['labelName'];
}

export interface NumCustomLabelsAndFolders {
  numCustomLabels?: number;
  numCustomFolders?: number;
}
