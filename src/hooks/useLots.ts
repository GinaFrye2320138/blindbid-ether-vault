import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { type Address } from "viem";

import { appEnv } from "@/config/env";
import blindBidAbi from "@/abi/BlindBidAuction.json";

export interface LotSummary {
  id: bigint;
  curator: string;
  startTime: number;
  endTime: number;
  closed: boolean;
  revealRequested: boolean;
  settled: boolean;
  bidCount: number;
  encryptedReserve: `0x${string}`;
  encryptedWinningBid: `0x${string}`;
  encryptedWinningIndex: `0x${string}`;
  winner: string;
  revealedAmount: bigint;
  metadataURI: string;
}

type RawLot = {
  curator: string;
  startTime: bigint;
  endTime: bigint;
  closed: boolean;
  revealRequested: boolean;
  settled: boolean;
  bidCount: bigint;
  encryptedReserve: `0x${string}`;
  encryptedWinningBid: `0x${string}`;
  encryptedWinningIndex: `0x${string}`;
  winner: string;
  revealedAmount: bigint;
  metadataURI: string;
};

const transformLot = (id: bigint, lot: RawLot): LotSummary => ({
  id,
  curator: lot.curator,
  startTime: Number(lot.startTime),
  endTime: Number(lot.endTime),
  closed: lot.closed,
  revealRequested: lot.revealRequested,
  settled: lot.settled,
  bidCount: Number(lot.bidCount),
  encryptedReserve: lot.encryptedReserve,
  encryptedWinningBid: lot.encryptedWinningBid,
  encryptedWinningIndex: lot.encryptedWinningIndex,
  winner: lot.winner,
  revealedAmount: BigInt(lot.revealedAmount ?? 0n),
  metadataURI: lot.metadataURI,
});

/**
 * Fetches the live lot catalogue from the BlindBid contract.
 */
export const useLots = () => {
  const publicClient = usePublicClient();

  return useQuery<LotSummary[]>({
    queryKey: ["blindbid", "lots"],
    enabled: Boolean(publicClient && appEnv.contractAddress),
    refetchInterval: 30000,
    queryFn: async () => {
      if (!publicClient || !appEnv.contractAddress) {
        return [];
      }

      const contractAddress = appEnv.contractAddress as Address;
      const lotIds = (await publicClient.readContract({
        address: contractAddress,
        abi: blindBidAbi,
        functionName: "getAllLotIds",
      })) as bigint[];

      if (!lotIds.length) {
        return [];
      }

      const lots = await Promise.all(
        lotIds.map(async (lotId) => {
          const lot = (await publicClient.readContract({
            address: contractAddress,
            abi: blindBidAbi,
            functionName: "getLot",
            args: [lotId],
          })) as RawLot;

          return transformLot(lotId, lot);
        }),
      );

      return lots.sort((a, b) => b.startTime - a.startTime);
    },
  });
};
