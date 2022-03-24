import { Button } from 'components/button/Button';
import { memo } from 'react';
import { prettifyNumber } from 'utils/helperFunctions';
import { AmountTknFiat } from 'elements/earn/portfolio/v3/initWithdraw/useV3WithdrawModal';
import { Token } from 'services/observables/tokens';

interface Props {
  amount: AmountTknFiat;
  setStep: (step: number) => void;
  token: Token;
}

const V3WithdrawStep2 = ({ setStep, amount, token }: Props) => {
  return (
    <div className="text-center">
      <button onClick={() => setStep(1)}>{'<-'} Change amount</button>
      <h1 className="text-[36px] font-normal my-50">
        Remove{' '}
        <span className="text-primary">
          {prettifyNumber(amount.tkn)} {token.symbol}
        </span>{' '}
        from earning rewards
      </h1>
      <div className="flex justify-center">
        <Button className="px-50" onClick={() => setStep(3)}>
          Remove
        </Button>
      </div>
    </div>
  );
};

export default memo(V3WithdrawStep2);
