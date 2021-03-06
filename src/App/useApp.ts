import { NETWORK } from 'consts'
import { useSetRecoilState } from 'recoil'
import _ from 'lodash'
import * as Sentry from '@sentry/react'
import shareToken from 'images/ShareLog.png'
import ContractStore from 'store/ContractStore'
import { AssetNativeDenomEnum, AssetSymbolEnum, AssetType } from 'types/asset'

const defaultList: AssetType[] = [
  {
    symbol: AssetSymbolEnum.$SHARE,
    name: '$Share',
    logoURI: `${shareToken}`,
    terraToken: AssetNativeDenomEnum.$share,
  },
  {
    symbol: AssetSymbolEnum.Luna,
    name: 'Luna',
    logoURI: 'https://assets.terra.money/icon/60/Luna.png',
    terraToken: AssetNativeDenomEnum.uluna,
  },
  {
    symbol: AssetSymbolEnum.UST,
    name: 'Terra USD',
    logoURI: 'https://assets.terra.money/icon/60/UST.png',
    terraToken: AssetNativeDenomEnum.uusd,
  },
  {
    symbol: AssetSymbolEnum.KRT,
    name: 'Terra KRW',
    logoURI: 'https://assets.terra.money/icon/60/KRT.png',
    terraToken: AssetNativeDenomEnum.ukrw,
  },
  {
    symbol: AssetSymbolEnum.SDT,
    name: 'Terra SDR',
    logoURI: 'https://assets.terra.money/icon/60/SDT.png',
    terraToken: AssetNativeDenomEnum.usdr,
  },
  {
    symbol: AssetSymbolEnum.MNT,
    name: 'Terra MNT',
    logoURI: 'https://assets.terra.money/icon/60/MNT.png',
    terraToken: AssetNativeDenomEnum.umnt,
  },
]

type ShuttlePairType = Record<'mainnet' | 'testnet', Record<string, string[]>>

type TerraWhiteListType = Record<
  'mainnet' | 'testnet',
  Record<
    string,
    {
      protocol: string
      symbol: string
      name?: string
      token: string
      icon: string
    }
  >
>

const useApp = (): {
  initApp: () => Promise<void>
} => {
  const setAssetList = useSetRecoilState(ContractStore.initOnlyAssetList)
  const setShuttlePairs = useSetRecoilState(ContractStore.initOnlyShuttlePairs)
  const setTerraWhiteList = useSetRecoilState(
    ContractStore.initOnlyTerraWhiteList
  )
  const setEthWhiteList = useSetRecoilState(ContractStore.initOnlyEthWhiteList)
  const setBscWhiteList = useSetRecoilState(ContractStore.initOnlyBscWhiteList)
  const setHmyWhiteList = useSetRecoilState(ContractStore.initOnlyHmyWhiteList)

  const getContractAddress = async (): Promise<void> => {
    try {
      const fetchPairJson: ShuttlePairType = await (
        await fetch(NETWORK.SHUTTLE_PAIRS)
      ).json()
      const formattedPairJson = _.reduce<
        ShuttlePairType,
        Record<string, Record<string, string>>
      >(
        fetchPairJson,
        (result, pairs, network) => {
          const val = _.reduce<
            Record<string, string[]>,
            Record<string, string>
          >(
            pairs,
            (obj, arr, tokenAddress) => {
              obj[arr[1]] = tokenAddress
              return obj
            },
            {}
          )
          result[network] = val
          return result
        },
        {}
      )
      setShuttlePairs(formattedPairJson)

      const terraListJson: TerraWhiteListType = await (
        await fetch(NETWORK.TERRA_WHITELIST)
      ).json()
      const assetList = _.reduce<
        TerraWhiteListType,
        Record<string, AssetType[]>
      >(
        terraListJson,
        (result, pairs, network) => {
          const val: AssetType[] = _.map(pairs, (item) => {
            return {
              symbol: item.symbol as AssetSymbolEnum,
              name: item.name || item.protocol,
              logoURI: item.icon,
              terraToken: item.token,
            }
          })
          result[network] = defaultList.concat(val)
          return result
        },
        {}
      )

      setAssetList(assetList)

      const formattedTerraListJson = _.reduce<
        any,
        Record<string, Record<string, string>>
      >(
        terraListJson,
        (result, pairs, network) => {
          const val = _.reduce<{ token: string }, Record<string, string>>(
            pairs,
            (obj, { token }) => {
              obj[token] = token
              return obj
            },
            {
              [AssetNativeDenomEnum.uluna]: AssetNativeDenomEnum.uluna,
              [AssetNativeDenomEnum.$share]: AssetNativeDenomEnum.$share,
              [AssetNativeDenomEnum.uusd]: AssetNativeDenomEnum.uusd,
              [AssetNativeDenomEnum.ukrw]: AssetNativeDenomEnum.ukrw,
              [AssetNativeDenomEnum.usdr]: AssetNativeDenomEnum.usdr,
              [AssetNativeDenomEnum.umnt]: AssetNativeDenomEnum.umnt,
            }
          )
          result[network] = val
          return result
        },
        {}
      )
      setTerraWhiteList(formattedTerraListJson)

      const ethListJson = await (await fetch(NETWORK.ETH_WHITELIST)).json()
      setEthWhiteList(ethListJson)

      const bscListJson = await (await fetch(NETWORK.BSC_WHITELIST)).json()
      setBscWhiteList(bscListJson)

      const hmyListJson = await (await fetch(NETWORK.HMY_WHITELIST)).json()
      setHmyWhiteList(hmyListJson)
    } catch (error) {
      Sentry.captureException(error)
    }
  }

  const initApp = async (): Promise<void> => {
    return getContractAddress()
  }

  return {
    initApp,
  }
}

export default useApp
