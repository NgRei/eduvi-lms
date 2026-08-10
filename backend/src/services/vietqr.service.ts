export interface VietQROptions {
  bankId?: string;
  accountNo?: string;
  accountName?: string;
  amount: number;
  addInfo: string;
  template?: 'compact2' | 'compact' | 'qr_only' | 'print';
}

export const generateVietQRUrl = (options: VietQROptions): string => {
  const bankId = options.bankId || process.env.VIETQR_BANK_ID || 'ACB';
  const accountNo = options.accountNo || process.env.VIETQR_ACCOUNT_NO || '15781537';
  const accountName = encodeURIComponent(options.accountName || process.env.VIETQR_ACCOUNT_NAME || 'Cao Trong Nguyen');
  const template = options.template || 'compact2';
  const amount = Math.round(options.amount);
  const addInfo = encodeURIComponent(options.addInfo);

  return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
};

export const getVietQRBankInfo = () => {
  return {
    bankId: process.env.VIETQR_BANK_ID || 'ACB',
    bankName: process.env.VIETQR_BANK_NAME || 'Ngân hàng Á Châu (ACB)',
    accountNo: process.env.VIETQR_ACCOUNT_NO || '15781537',
    accountName: process.env.VIETQR_ACCOUNT_NAME || 'Cao Trong Nguyen',
  };
};
