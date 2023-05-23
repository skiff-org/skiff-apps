import toCSSColor from './ui/toCSSColor';

const VAR_PATTERN = /var\((?<color>.*)\)/;

const getColorForMarkSpec = (color: string, attributeName: string) => {
  const match = color.match(VAR_PATTERN);

  if (match) {
    const { groups } = match;

    if (groups) {
      const colorWithVariable = groups.color;

      if (colorWithVariable) {
        return {
          [attributeName]: color
        };
      }
    }
  }

  return {
    [attributeName]: toCSSColor(color)
  };
};

export default getColorForMarkSpec;
