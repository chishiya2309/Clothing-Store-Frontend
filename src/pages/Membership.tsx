import { useEffect, useState } from 'react'
import { profileService, type MembershipInfoResponse } from '@/services/profile.service'

const TIER_CONFIG: Record<string, { icon: string; color: string; gradient: string; bg: string }> = {
  'Đồng': {
    icon: '🥉',
    color: 'text-amber-700',
    gradient: 'from-amber-600 to-amber-800',
    bg: 'bg-amber-50 border-amber-200'
  },
  'Bạc': {
    icon: '🥈',
    color: 'text-slate-500',
    gradient: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-50 border-slate-200'
  },
  'Vàng': {
    icon: '🥇',
    color: 'text-yellow-500',
    gradient: 'from-yellow-400 to-amber-500',
    bg: 'bg-yellow-50 border-yellow-200'
  },
  'Kim cương': {
    icon: '💎',
    color: 'text-cyan-500',
    gradient: 'from-cyan-400 to-blue-600',
    bg: 'bg-cyan-50 border-cyan-200'
  }
}

const DEFAULT_TIER_STYLE = {
  icon: '⭐',
  color: 'text-on-surface-variant',
  gradient: 'from-gray-400 to-gray-600',
  bg: 'bg-surface-alt border-border-subtle'
}

export default function Membership() {
  const [data, setData] = useState<MembershipInfoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    profileService.getMembershipInfo()
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || 'Không thể tải thông tin thành viên'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-error-container text-on-error-container rounded-xl border border-error bg-opacity-20">
        <p className="font-body-md">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const currentStyle = data.currentTierName
    ? (TIER_CONFIG[data.currentTierName] || DEFAULT_TIER_STYLE)
    : DEFAULT_TIER_STYLE

  // Calculate progress percentage for the progress bar
  let progressPercent = 0
  if (data.currentTierName && data.pointsNeededForNextTier != null) {
    const currentTier = data.allTiers.find(t => t.name === data.currentTierName)
    const nextTier = data.allTiers.find(t => t.name === data.nextTierName)
    if (currentTier && nextTier) {
      const range = nextTier.minPoints - currentTier.minPoints
      const progress = data.loyaltyPoints - currentTier.minPoints
      progressPercent = Math.min(100, Math.max(0, (progress / range) * 100))
    }
  } else if (!data.currentTierName && data.pointsNeededForNextTier != null) {
    // No tier yet, progress toward first tier
    const firstTier = data.allTiers[0]
    if (firstTier) {
      progressPercent = Math.min(100, Math.max(0, (data.loyaltyPoints / firstTier.minPoints) * 100))
    }
  } else {
    // Already at max tier
    progressPercent = 100
  }

  return (
    <>
      <h1 className="font-headline-lg text-headline-lg md:font-headline-xl md:text-headline-xl text-primary mb-xl">
        Hạng thành viên
      </h1>

      <div className="space-y-xl">
        {/* Current Tier Card */}
        <div className={`relative overflow-hidden rounded-2xl border p-8 ${currentStyle.bg}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="text-5xl">{currentStyle.icon}</div>
            <div className="flex-grow">
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">
                Hạng hiện tại
              </p>
              <h2 className={`font-headline-xl text-headline-xl ${currentStyle.color}`}>
                {data.currentTierName || 'Chưa có hạng'}
              </h2>
              {data.currentTierDescription && (
                <p className="text-on-surface-variant font-body-md text-body-md mt-2">
                  {data.currentTierDescription}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">
                Điểm tích lũy
              </p>
              <p className="font-headline-xl text-headline-xl text-primary">
                {data.loyaltyPoints.toLocaleString('vi-VN')}
              </p>
              <p className="text-on-surface-variant font-body-sm text-body-sm">điểm</p>
            </div>
          </div>

          {/* Discount Badge */}
          {data.currentTierDiscount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/70 rounded-full border border-white/50">
              <span className="material-symbols-outlined text-primary text-lg">local_offer</span>
              <span className="font-label-caps text-label-caps text-primary">
                Giảm {data.currentTierDiscount}% cho mọi đơn hàng
              </span>
            </div>
          )}
        </div>

        {/* Progress Section */}
        {data.nextTierName && data.pointsNeededForNextTier != null && (
          <div className="bg-surface-alt rounded-2xl p-6 border border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline-md text-headline-md text-primary">
                Tiến trình thăng hạng
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant font-body-sm text-body-sm">
                  Hạng tiếp theo:
                </span>
                <span className={`font-label-caps text-label-caps ${(TIER_CONFIG[data.nextTierName] || DEFAULT_TIER_STYLE).color}`}>
                  {(TIER_CONFIG[data.nextTierName] || DEFAULT_TIER_STYLE).icon} {data.nextTierName}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-3 bg-surface-container-high rounded-full overflow-hidden mb-3">
              <div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${currentStyle.gradient} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-body-sm text-body-sm">
                {data.loyaltyPoints.toLocaleString('vi-VN')} điểm
              </span>
              <span className="text-primary font-body-md text-body-md font-semibold">
                Cần thêm <strong>{data.pointsNeededForNextTier.toLocaleString('vi-VN')}</strong> điểm
              </span>
            </div>

            <p className="text-on-surface-variant font-body-sm text-body-sm mt-3">
              <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
              Quy đổi: 1 điểm = 1.000 VNĐ mua hàng
            </p>
          </div>
        )}

        {/* Already at max tier */}
        {!data.nextTierName && data.currentTierName && (
          <div className="bg-surface-alt rounded-2xl p-6 border border-border-subtle text-center">
            <span className="material-symbols-outlined filled text-4xl text-yellow-500 mb-2">emoji_events</span>
            <p className="font-headline-md text-headline-md text-primary">
              Chúc mừng! Bạn đang ở hạng cao nhất
            </p>
            <p className="text-on-surface-variant font-body-md text-body-md mt-1">
              Tận hưởng tất cả ưu đãi dành riêng cho thành viên {data.currentTierName}.
            </p>
          </div>
        )}

        {/* All Tiers Table */}
        <div>
          <h3 className="font-headline-md text-headline-md text-primary mb-lg">
            Bảng đặc quyền thành viên
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.allTiers.map((tier) => {
              const style = TIER_CONFIG[tier.name] || DEFAULT_TIER_STYLE
              const isCurrentTier = tier.name === data.currentTierName

              return (
                <div
                  key={tier.name}
                  className={`rounded-xl border-2 p-5 transition-all ${
                    isCurrentTier
                      ? `${style.bg} border-current ring-2 ring-primary/20 scale-[1.02]`
                      : 'bg-surface-alt border-border-subtle hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{style.icon}</span>
                    <div className="flex-grow">
                      <h4 className={`font-headline-sm text-headline-sm ${style.color}`}>
                        {tier.name}
                      </h4>
                    </div>
                    {isCurrentTier && (
                      <span className="px-3 py-1 bg-primary text-on-primary font-label-caps text-xs rounded-full">
                        Hạng của bạn
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-body-sm font-body-sm">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm">stars</span>
                      <span>Yêu cầu: <strong className="text-primary">{tier.minPoints.toLocaleString('vi-VN')}</strong> điểm</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm">local_offer</span>
                      <span>Giảm giá: <strong className="text-primary">{tier.discountPercent}%</strong></span>
                    </div>
                    {tier.description && (
                      <div className="flex items-start gap-2 text-on-surface-variant mt-1">
                        <span className="material-symbols-outlined text-sm mt-0.5">info</span>
                        <span>{tier.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
