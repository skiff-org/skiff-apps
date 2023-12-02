import { Alignment, Typography, TypographyWeight } from 'nightwatch-ui';

export const getProgressViewText = (title: string, description: string, center?: boolean) => (
  <>
    <Typography weight={TypographyWeight.MEDIUM}> {title} </Typography>
    <Typography align={center ? Alignment.CENTER : undefined} color='secondary' wrap={center}>
      {description}
    </Typography>
  </>
);
