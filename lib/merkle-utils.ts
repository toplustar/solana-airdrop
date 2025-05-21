import { keccak_256 } from "js-sha3"
import { PublicKey } from "@solana/web3.js"

export interface Recipient {
  address: string
  amount: number
}


interface CSVTotals {
  totalAmount: number;
  maxNodes: number;
  recipients: Recipient[];
}

export async function calculateCSVTotals(file: File, tokenDecimals: number): Promise<CSVTotals> {
  const text = await file.text();
  const rows = text
    .split('\n')
    .filter(row => row.trim())
    .slice(1);

  const recipients: Recipient[] = rows.map(row => {
    const [address, amount] = row.split(',');
    if (!address || !amount) return null;

    const amountInSmallestUnit = Math.floor(
      parseFloat(amount.trim()) * Math.pow(10, tokenDecimals)
    );

    return {
      address: address.trim(),
      amount: amountInSmallestUnit
    };
  }).filter((recipient): recipient is Recipient => recipient !== null);

  const maxNodes = recipients.length;
  const totalAmount = recipients.reduce((sum, recipient) => sum + recipient.amount, 0);

  return {
    totalAmount,
    maxNodes,
    recipients
  };
}

export async function transformCSVFormat(file: File, tokenDecimals: number, type: string): Promise<File> {
  const text = await file.text();
  const rows = text
    .split('\n')
    .filter(row => row.trim())
    .slice(1);

  const newRows = rows.map(row => {
    const [address, amount] = row.split(',');
    if (!address || !amount) return null;

    const amountInSmallestUnit = Math.floor(
      parseFloat(amount.trim()) * Math.pow(10, tokenDecimals)
    );

    const amountUnlocked = type === "instant" ? amountInSmallestUnit : 0;
    const amountLocked = type === "vested" ? amountInSmallestUnit : 0;

    return `${address.trim()},${amountUnlocked},${amountLocked},Staker`;
  }).filter((row): row is string => row !== null);

  const newContent = "pubkey,amount_unlocked,amount_locked,category\n" + newRows.join('\n');

  return new File([newContent], file.name, { type: "text/csv" });
}
