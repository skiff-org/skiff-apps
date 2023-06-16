import { AddressObject, DisplayPictureData } from 'skiff-graphql';

export type AddressObjectWithDisplayPicture = AddressObject & { displayPictureData?: DisplayPictureData };
