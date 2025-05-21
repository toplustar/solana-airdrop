# Airflux

Airflux is a modern web application built with Next.js for managing and distributing airdrops on the Solana blockchain. 

## Features

- Solana blockchain integration
- Streamflow API integration for token distribution
- Create Airdrop
- Claim Airdrop
- Search Airdrop
- Real-time airdrop status tracking

## Tech Stack

- **Framework**: Next.js 15.2.4
- **Language**: TypeScript
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS
- **Blockchain**: Solana Web3.js
- **State Management**: React Hooks
- **Form Handling**: React Hook Form with Zod validation
- **Wallet Integration**: Solana Wallet Adapter
- **API Integration**: Streamflow Finance API (v2)
- **Token Distribution**: Streamflow JS SDK

## Project Structure

```
airflux/
├── app/                    # Next.js app directory (pages and layouts)
├── components/            # Reusable UI components
├── contexts/             # React context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── providers/            # Service providers and API clients
├── public/              # Static assets
├── styles/              # Global styles and Tailwind CSS
├── types/               # TypeScript type definitions
├── .next/               # Next.js build output
├── node_modules/        # Dependencies
├── next.config.mjs      # Next.js configuration
├── package.json         # Project dependencies and scripts
├── postcss.config.mjs   # PostCSS configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Streamflow Integration

This project uses the Streamflow JS SDK for airdrop management. The SDK provides the following key features:

- Token vesting and streaming
- Airdrop distribution to multiple recipients
- Real-time stream status tracking
- Integration with Solana blockchain

### Installation

```bash
# Install Stream Protocol SDK
npm install @streamflow/stream
# or
yarn add @streamflow/stream

# Install Distributor Protocol SDK
npm install @streamflow/common @streamflow/distributor
# or
yarn add @streamflow/common @streamflow/distributor
```

## Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn
- A Solana wallet (Phantom, Solflare, etc.)
- Streamflow API access

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
cd airflux
```

2. Install dependencies:
```bash
yarn install
```

3. Start the development server:
```bash
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `yarn run dev` - Start development server
- `yarn run build` - Build for production
- `yarn run start` - Start production server

## API Integration

The application integrates with the Streamflow Finance API (v2) for token distribution and airdrop management. The API documentation can be found at [Streamflow API Docs](https://staging-api-public.streamflow.finance/v2/docs).

For more information about the Streamflow SDK, visit the [official documentation](https://github.com/streamflow-finance/js-sdk).

