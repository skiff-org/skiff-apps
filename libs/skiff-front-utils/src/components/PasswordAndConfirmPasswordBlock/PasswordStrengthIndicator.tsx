import { Color, CircularProgress, Size } from '@skiff-org/skiff-ui';
import React from 'react';

type PasswordStrengthBarProps = {
  // the user's entered password
  password: string;
  // whether or not the password is strong (above score 3)
  setStrongPassword: (strongPassword: boolean) => void;
};

enum PasswordScore {
  WEAK = 0,
  MEDIUM = 1,
  STRONG = 2
}

/**
 * Component that renders the password strength bar underneath
 * the password textfield.
 */
function PasswordStrengthIndicator(props: PasswordStrengthBarProps) {
  const { password, setStrongPassword } = props;
  const [score, setScore] = React.useState(0);

  React.useEffect(() => {
    // https://jmduke.com/2017/09/16/how-i-cut-my-webpack-bundle-size-in-half
    // See "Lazy load zxcvbn" section
    void import(/* webpackChunkName: "zxcvbn" */ 'zxcvbn').then(({ default: zxcvbn }) => {
      let score = 0;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const result = zxcvbn(password);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      score = result.score;
      // strongPassword will be true if the score passes zxcvbn's metric
      setStrongPassword(score >= PasswordScore.STRONG);
      setScore(score);
    });
  }, [password, setStrongPassword]);

  const getProgressIndicatorProps = (): { progressColor: Color; progress: number; tooltip: string } => {
    if (!password) return { progressColor: 'disabled', progress: 0, tooltip: '' };

    switch (score) {
      case PasswordScore.WEAK:
        return { progressColor: 'red', progress: 25, tooltip: 'Weak password' };
      case PasswordScore.MEDIUM:
        return { progressColor: 'yellow', progress: 75, tooltip: 'Medium password' };
      case PasswordScore.STRONG:
      default:
        return { progressColor: 'green', progress: 100, tooltip: 'Strong password' };
    }
  };

  return <CircularProgress size={Size.SMALL} {...getProgressIndicatorProps()} />;
}

export default PasswordStrengthIndicator;
