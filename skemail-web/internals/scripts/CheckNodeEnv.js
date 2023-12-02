// eslint-disable-next-line import/no-extraneous-dependencies
import chalk from 'chalk';

export default function CheckNodeEnv(expectedEnv) {
  if (!expectedEnv) {
    throw new Error('"expectedEnv" not set');
  }

  if (process.env.NODE_ENV !== expectedEnv) {
    console.log(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      chalk.whiteBright.bgRed.bold(`"process.env.NODE_ENV" must be "${expectedEnv}" to use this webpack config`)
    );
    process.exit(2);
  }
}
