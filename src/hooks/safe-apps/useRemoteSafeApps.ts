import { useEffect, useMemo } from 'react'
import type { SafeAppsResponse } from '@safe-global/safe-gateway-typescript-sdk'
import { getSafeApps } from '@safe-global/safe-gateway-typescript-sdk'
import { Errors, logError } from '@/services/exceptions'
import useChainId from '@/hooks/useChainId'
import type { AsyncResult } from '../useAsync'
import useAsync from '../useAsync'
import type { SafeAppsTag } from '@/config/constants'

// To avoid multiple simultaneous requests (e.g. the Dashboard and the SAFE header widget),
// cache the request promise for 100ms
let cache: Record<string, Promise<SafeAppsResponse> | undefined> = {
  "41144114": Promise.resolve([{
    "id":29,
    "url":"https://apps-portal.safe.global/tx-builder",
    "name":"Transaction Builder",
    "iconUrl":"https://safe-transaction-assets.safe.global/safe_apps/29/icon.png",
    "description":"Compose custom contract interactions and batch them into a single transaction",
    "chainIds":[
      "1",
      "4",
      "10",
      "56",
      "100",
      "137",
      "246",
      "324",
      "1101",
      "8453",
      "84532",
      "42161",
      "42220",
      "43114",
      "73799",
      "84531",
      "1313161554",
      "11155111",
      "41144114"
    ],
    "provider":null,
    "accessControl":{
      "type":"NO_RESTRICTIONS",
      "value":null
    },
    "tags":[
      "dashboard-widgets",
      "Infrastructure",
      "transaction-builder"
    ],
    "features":[
      "BATCHED_TRANSACTIONS"
    ],
    "developerWebsite":"https://safe.global",
    "socialProfiles":[
      {
        "platform":"DISCORD",
        "url":"https://chat.safe.global"
      },
      {
        "platform":"GITHUB",
        "url":"https://github.com/safe-global"
      },
      {
        "platform":"TWITTER",
        "url":"https://twitter.com/safe"
      }
    ]
  }]),
}

const cachedGetSafeApps = (chainId: string): ReturnType<typeof getSafeApps> | undefined => {
  if (!cache[chainId]) {
    cache[chainId] = getSafeApps(chainId, { client_url: window.location.origin })

    // Clear the cache the promise resolves with a small delay
    cache[chainId]
      ?.catch(() => null)
      .then(() => {
        setTimeout(() => (cache[chainId] = undefined), 100)
      })
  }

  return cache[chainId]
}

const useRemoteSafeApps = (tag?: SafeAppsTag): AsyncResult<SafeAppsResponse> => {
  const chainId = useChainId()

  const [remoteApps, error, loading] = useAsync<SafeAppsResponse>(() => {
    if (!chainId) return
    return cachedGetSafeApps(chainId)
  }, [chainId])

  useEffect(() => {
    if (error) {
      logError(Errors._902, error.message)
    }
  }, [error])

  const apps = useMemo(() => {
    if (!remoteApps || !tag) return remoteApps
    return remoteApps.filter((app) => app.tags.includes(tag))
  }, [remoteApps, tag])

  const sortedApps = useMemo(() => {
    return apps?.sort((a, b) => a.name.localeCompare(b.name))
  }, [apps])

  return [sortedApps, error, loading]
}

export { useRemoteSafeApps }
