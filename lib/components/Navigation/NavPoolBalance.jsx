import React, { useState } from 'react'
import Link from 'next/link'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import { NETWORK, numberWithCommas } from '@pooltogether/utilities'
import { Modal, PoolIcon, ButtonLink } from '@pooltogether/react-components'
import {
  useCoingeckoTokenData,
  useClaimableTokenFromTokenFaucets,
  useRetroactivePoolClaimData,
  useTotalClaimablePool,
  useGovernanceChainId,
  useUsersAddress,
  usePoolTokenData,
  useTokenHolder,
  useUserTicketsFormattedByPool
} from '@pooltogether/hooks'

import { GOVERNANCE_CONTRACT_ADDRESSES } from '../../../lib/constants'

import Squiggle from 'assets/images/squiggle.svg'

const P_POOL_ADDRESS = '0x396b4489da692788e327e2e4b2b0459a5ef26791'

export const NavPoolBalance = (props) => {
  const { className } = props
  const [isOpen, setIsOpen] = useState(false)
  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  const { data: tokenData, isFetched } = usePoolTokenData()

  if (!isFetched || !tokenData) {
    return null
  }

  return (
    <>
      <div
        className={classnames(
          'flex relative text-highlight-4 hover:text-white font-bold cursor-pointer pool-gradient-1 rounded-full px-3 xs:px-4 p-2 leading-none trans',
          className
        )}
        onClick={openModal}
      >
        POOL
      </div>
      <PoolBalanceModal isOpen={isOpen} closeModal={closeModal} tokenData={tokenData} />
    </>
  )
}

const PoolBalanceModal = (props) => {
  const { t } = useTranslation()

  const { isOpen, closeModal, tokenData } = props
  const { usersBalanceBN, usersBalance, totalSupply } = tokenData

  const chainId = useGovernanceChainId()
  const usersAddress = useUsersAddress()

  // TOKEN DATA
  const totalSupplyFormatted = numberWithCommas(totalSupply)

  const tokenAddress = GOVERNANCE_CONTRACT_ADDRESSES[chainId]?.GovernanceToken
  const { data: tokenInfo } = useCoingeckoTokenData(chainId, tokenAddress)
  const inCirculationFormatted = numberWithCommas(tokenInfo?.market_data?.circulating_supply)

  // USERS DATA
  const zeroBn = ethers.BigNumber.from(0)

  // Claimable
  const poolTokenAddress = GOVERNANCE_CONTRACT_ADDRESSES[chainId].GovernanceToken.toLowerCase()
  const { data: retroPoolClaimData } = useRetroactivePoolClaimData(usersAddress)
  const { data: claimableFromTokenFaucets } = useClaimableTokenFromTokenFaucets(
    NETWORK.mainnet,
    usersAddress
  )
  let totalClaimablePool =
    claimableFromTokenFaucets?.totals?.[poolTokenAddress]?.totalClaimableAmountUnformatted || zeroBn
  if (retroPoolClaimData?.amount && !retroPoolClaimData.isClaimed) {
    totalClaimablePool = totalClaimablePool.add(retroPoolClaimData.amount)
  }
  const totalClaimablePoolFormatted =
    numberWithCommas(ethers.utils.formatEther(totalClaimablePool)) || '0.00'

  // POOL Balance
  const balanceFormatted = usersBalance ? numberWithCommas(usersBalance) : '0.00'

  // pPOOL Balance
  const { data: playerDepositData } = useUserTicketsFormattedByPool(usersAddress)
  const pPoolPlayerDepositData = playerDepositData?.find(
    (depositData) => depositData.poolAddress === P_POOL_ADDRESS
  )
  const pPoolBalance = pPoolPlayerDepositData?.total.amountUnformatted || zeroBn
  const pPoolBalanceFormatted = numberWithCommas(pPoolBalance)

  // DELEGATED Balance
  // let blockNumber
  // if (readProvider?.getBlockNumber) {
  //   const blockNumber = await readProvider.getBlockNumber()
  //   const block = await readProvider.getBlock(blockNumber)
  // }
  // const blockNumber = getBlockNumber()
  const blockNumber = 'latest'
  const { data: tokenHolder } = useTokenHolder(usersAddress, blockNumber)
  console.log({ tokenHolder })

  const delegatedBalance = tokenHolder?.delegatedVotes || zeroBn
  const delegatedBalanceFormatted = numberWithCommas(delegatedBalance || zeroBn)

  const totalPool = delegatedBalance.add(pPoolBalance).add(usersBalanceBN).add(totalClaimablePool)

  const openClaimRewards = (e) => {
    closeModal()
  }

  return (
    <Modal
      label='POOL Token Details Modal'
      isOpen={isOpen}
      closeModal={closeModal}
      className='flex flex-col'
    >
      <div className='py-4 flex flex-col'>
        <div className='flex mx-auto'>
          <PoolIcon className='shadow-xl w-28 h-28 spinningCoin' />
          <div className='flex flex-col ml-8 justify-center mr-8 leading-none'>
            <h2>{numberWithCommas(totalPool)}</h2>
            <span className='font-bold text-accent-1 mt-1 uppercase'>
              {t('totalPool', 'Total POOL')}
            </span>
          </div>
        </div>
        <div className='bg-body p-4 rounded-xl mt-8'>
          <div className='flex justify-between'>
            <span className='text-accent-1'>{t('balanceHeld', 'Balance held')}:</span>
            <span className='font-bold'>{balanceFormatted}</span>
          </div>

          <div className='flex justify-between'>
            <span className='text-accent-1'>{t('delegatedToYou', 'Delegated to you')}:</span>
            <span className='font-bold'>{delegatedBalanceFormatted}</span>
          </div>

          <div className='flex justify-between'>
            <span className='text-accent-1'>{t('pPOOL', 'pPOOL balance')}:</span>
            <span className='font-bold'>{pPoolBalanceFormatted}</span>
          </div>

          <div className='flex justify-between'>
            <span className='text-accent-1'>{t('unclaimed')}:</span>
            <span className='font-bold'>{totalClaimablePoolFormatted}</span>
          </div>

          <img src={Squiggle} className='mx-auto mt-4 mb-3' />

          <div className='flex justify-between'>
            <span className='text-accent-1'>{t('inCirculation')}:</span>
            <span className='font-bold'>{inCirculationFormatted}</span>
          </div>

          <div className='flex justify-between'>
            <span className='text-accent-1'>{t('totalSupply')}:</span>
            <span className='font-bold'>{totalSupplyFormatted}</span>
          </div>
        </div>

        <ButtonLink
          Link={Link}
          textSize='xxxs'
          onClick={openClaimRewards}
          href='https://app.pooltogether.com/account#governance-claims'
          as='https://app.pooltogether.com/account#governance-claims'
          width='w-full'
          className='mt-4'
        >
          {t('claimPool')}
        </ButtonLink>
        <ButtonLink
          Link={Link}
          textSize='xxxs'
          as='https://sybil.org/#/delegates/pool'
          href='https://sybil.org/#/delegates/pool'
          width='w-full'
          className='mt-4'
        >
          {t('activateVotingPower')}
        </ButtonLink>
      </div>
    </Modal>
  )
}
