import { keccak_256 } from "js-sha3"
import { PublicKey } from "@solana/web3.js"

export interface Recipient {
  address: string
  amount: number
}

export class MerkleTree {
  private readonly leaves: Buffer[]
  private readonly layers: Buffer[][]

  constructor(recipients: Recipient[]) {
    // Sort recipients by address to ensure consistent tree generation
    const sortedRecipients = recipients.sort((a, b) => a.address.localeCompare(b.address))
    
    // Create leaves from recipient data
    this.leaves = sortedRecipients.map((recipient) => {
      const pubKey = new PublicKey(recipient.address)
      const amount = BigInt(recipient.amount)
      
      // Concatenate public key bytes and amount
      const concatenated = Buffer.concat([
        pubKey.toBuffer(),
        Buffer.from(amount.toString(16).padStart(16, '0'), 'hex')
      ])
      
      return Buffer.from(keccak_256.digest(concatenated))
    })

    // Build the Merkle tree
    this.layers = this.buildLayers(this.leaves)
  }

  private buildLayers(leaves: Buffer[]): Buffer[][] {
    const layers: Buffer[][] = [leaves]
    
    // Build tree layers until we reach the root
    while (layers[0].length > 1) {
      const layer: Buffer[] = []
      
      for (let i = 0; i < layers[0].length; i += 2) {
        if (i + 1 < layers[0].length) {
          const left = layers[0][i]
          const right = layers[0][i + 1]
          layer.push(Buffer.from(keccak_256.digest(Buffer.concat([left, right]))))
        } else {
          layer.push(layers[0][i])
        }
      }
      
      layers.unshift(layer)
    }
    
    return layers
  }

  public getRoot(): number[] {
    return Array.from(this.layers[0][0])
  }

  public getProof(index: number): Buffer[] {
    let currentIndex = index
    const proof: Buffer[] = []
    
    for (let i = this.layers.length - 1; i > 0; i--) {
      const layer = this.layers[i]
      const isLeft = currentIndex % 2 === 0
      const pairIndex = isLeft ? currentIndex + 1 : currentIndex - 1
      
      if (pairIndex < layer.length) {
        proof.push(layer[pairIndex])
      }
      
      currentIndex = Math.floor(currentIndex / 2)
    }
    
    return proof
  }

  public verifyProof(proof: Buffer[], leaf: Buffer, root: Buffer): boolean {
    let computedHash = leaf
    
    for (const proofElement of proof) {
      const concatenated = Buffer.concat(
        computedHash < proofElement 
          ? [computedHash, proofElement]
          : [proofElement, computedHash]
      )
      computedHash = Buffer.from(keccak_256.digest(concatenated))
    }
    
    return computedHash.equals(root)
  }
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
    .filter(row => row.trim()) // Filter out empty rows
    .slice(1); // Skip header row
    
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
