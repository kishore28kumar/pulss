import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { 
  Star, 
  Gift, 
  Coins, 
  Trophy, 
  Crown,
  Sparkle,
  Plus,
  CheckCircle
} from '@phosphor-icons/react'

interface LoyaltyData {
  currentPoints: number
  totalEarned: number
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
  nextLevelPoints: number
  redeemedRewards: RewardRedemption[]
  availableRewards: Reward[]
}

interface Reward {
  id: string
  title: string
  description: string
  pointsCost: number
  value: number
  type: 'discount' | 'freebie' | 'cashback' | 'shipping'
  icon: string
  expiryDays?: number
  minOrderValue?: number
}

interface RewardRedemption {
  id: string
  rewardId: string
  rewardTitle: string
  pointsUsed: number
  redeemedAt: string
  couponCode?: string
  status: 'active' | 'used' | 'expired'
}

const defaultRewards: Reward[] = [
  {
    id: 'discount-50',
    title: '₹50 Off Coupon',
    description: 'Save ₹50 on your next order above ₹200',
    pointsCost: 100,
    value: 50,
    type: 'discount',
    icon: '💰',
    expiryDays: 30,
    minOrderValue: 200
  },
  {
    id: 'free-shipping',
    title: 'Free Delivery',
    description: 'Get free home delivery on any order',
    pointsCost: 50,
    value: 50,
    type: 'shipping',
    icon: '🚚',
    expiryDays: 15
  },
  {
    id: 'discount-100',
    title: '₹100 Off Coupon',
    description: 'Save ₹100 on orders above ₹500',
    pointsCost: 200,
    value: 100,
    type: 'discount',
    icon: '🎯',
    expiryDays: 30,
    minOrderValue: 500
  },
  {
    id: 'health-checkup',
    title: 'Free Health Checkup',
    description: 'Basic health screening at partner clinics',
    pointsCost: 500,
    value: 300,
    type: 'freebie',
    icon: '🩺',
    expiryDays: 60
  },
  {
    id: 'cashback-5percent',
    title: '5% Cashback',
    description: 'Get 5% cashback on your next order',
    pointsCost: 150,
    value: 0,
    type: 'cashback',
    icon: '💳',
    expiryDays: 20
  }
]

const defaultLoyaltyData: LoyaltyData = {
  currentPoints: 150,
  totalEarned: 750,
  level: 'Silver',
  nextLevelPoints: 1000,
  redeemedRewards: [
    {
      id: 'redeemed-1',
      rewardId: 'free-shipping',
      rewardTitle: 'Free Delivery',
      pointsUsed: 50,
      redeemedAt: '2024-01-15T10:30:00Z',
      couponCode: 'FREESHIP2024',
      status: 'used'
    }
  ],
  availableRewards: defaultRewards
}

interface LoyaltyRewardsProps {
  customerId?: string
}

export const LoyaltyRewards: React.FC<LoyaltyRewardsProps> = ({ customerId = 'demo-customer' }) => {
  const [loyaltyData, setLoyaltyData] = useKV<LoyaltyData>(`loyalty-${customerId}`, defaultLoyaltyData)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)

  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'Bronze':
        return { color: 'bg-orange-600', icon: Star, pointsRequired: 0 }
      case 'Silver':
        return { color: 'bg-gray-400', icon: Coins, pointsRequired: 500 }
      case 'Gold':
        return { color: 'bg-yellow-500', icon: Trophy, pointsRequired: 1000 }
      case 'Platinum':
        return { color: 'bg-purple-600', icon: Crown, pointsRequired: 2500 }
      case 'Diamond':
        return { color: 'bg-blue-600', icon: Sparkle, pointsRequired: 5000 }
      default:
        return { color: 'bg-gray-400', icon: Star, pointsRequired: 0 }
    }
  }

  const redeemReward = (reward: Reward) => {
    if (!loyaltyData || loyaltyData.currentPoints < reward.pointsCost) {
      toast.error('Insufficient points for this reward')
      return
    }

    const couponCode = `REWARD${Date.now()}`
    const redemption: RewardRedemption = {
      id: `redeemed-${Date.now()}`,
      rewardId: reward.id,
      rewardTitle: reward.title,
      pointsUsed: reward.pointsCost,
      redeemedAt: new Date().toISOString(),
      couponCode,
      status: 'active'
    }

    setLoyaltyData((prevData) => {
      const currentData = prevData || defaultLoyaltyData
      return {
        ...currentData,
        currentPoints: currentData.currentPoints - reward.pointsCost,
        redeemedRewards: [...currentData.redeemedRewards, redemption]
      }
    })

    toast.success(
      `Reward redeemed successfully! Your coupon code is: ${couponCode}`,
      {
        duration: 8000,
        description: 'You can use this code during checkout'
      }
    )
    setSelectedReward(null)
  }

  const earnPointsDemo = () => {
    const pointsEarned = Math.floor(Math.random() * 50) + 10
    setLoyaltyData((prevData) => {
      const currentData = prevData || defaultLoyaltyData
      return {
        ...currentData,
        currentPoints: currentData.currentPoints + pointsEarned,
        totalEarned: currentData.totalEarned + pointsEarned
      }
    })
    toast.success(`Earned ${pointsEarned} loyalty points!`, {
      description: 'Keep shopping to earn more rewards'
    })
  }

  const currentLoyaltyData = loyaltyData || defaultLoyaltyData
  const levelConfig = getLevelConfig(currentLoyaltyData.level)
  const LevelIcon = levelConfig.icon
  const progressToNext = ((currentLoyaltyData.totalEarned - levelConfig.pointsRequired) / 
    (currentLoyaltyData.nextLevelPoints - levelConfig.pointsRequired)) * 100

  return (
    <div className="space-y-6">
      {/* Loyalty Status */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className={`w-12 h-12 ${levelConfig.color} rounded-full flex items-center justify-center`}>
              <LevelIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{currentLoyaltyData.level} Member</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {currentLoyaltyData.currentPoints} Points
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Total earned: {currentLoyaltyData.totalEarned} points
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to {currentLoyaltyData.level === 'Diamond' ? 'Max Level' : 'Next Level'}</span>
                <span>{currentLoyaltyData.totalEarned} / {currentLoyaltyData.nextLevelPoints}</span>
              </div>
              <Progress value={Math.min(progressToNext, 100)} className="h-2" />
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={earnPointsDemo}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Earn Points (Demo)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Available Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentLoyaltyData.availableRewards.map((reward) => {
              const canRedeem = currentLoyaltyData.currentPoints >= reward.pointsCost
              
              return (
                <Card 
                  key={reward.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    canRedeem ? 'border-green-200 hover:border-green-300' : 'opacity-60'
                  }`}
                  onClick={() => canRedeem && setSelectedReward(reward)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{reward.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{reward.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {reward.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Coins className="w-3 h-3" />
                            {reward.pointsCost} points
                          </Badge>
                          {canRedeem ? (
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Need {reward.pointsCost - currentLoyaltyData.currentPoints} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Redeemed Rewards */}
      {currentLoyaltyData.redeemedRewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Your Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentLoyaltyData.redeemedRewards.map((redemption) => (
                <div 
                  key={redemption.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{redemption.rewardTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      Redeemed on {new Date(redemption.redeemedAt).toLocaleDateString()}
                    </p>
                    {redemption.couponCode && (
                      <p className="text-xs font-mono bg-background px-2 py-1 rounded mt-1">
                        Code: {redemption.couponCode}
                      </p>
                    )}
                  </div>
                  <Badge 
                    variant={redemption.status === 'active' ? 'default' : 'secondary'}
                  >
                    {redemption.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reward Redemption Dialog */}
      {selectedReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{selectedReward.icon}</span>
                {selectedReward.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">{selectedReward.description}</p>
                
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span>Points Required:</span>
                    <span className="font-semibold">{selectedReward.pointsCost}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Your Points:</span>
                    <span className="font-semibold">{currentLoyaltyData.currentPoints}</span>
                  </div>
                </div>

                {selectedReward.expiryDays && (
                  <p className="text-sm text-orange-600">
                    * Reward expires in {selectedReward.expiryDays} days after redemption
                  </p>
                )}

                {selectedReward.minOrderValue && (
                  <p className="text-sm text-blue-600">
                    * Valid on orders above ₹{selectedReward.minOrderValue}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedReward(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => redeemReward(selectedReward)}
                    className="flex-1"
                  >
                    Redeem Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}