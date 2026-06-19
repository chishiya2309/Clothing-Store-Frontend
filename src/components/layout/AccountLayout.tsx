import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useEffect, useState } from 'react'
import { profileService, type UserProfileResponse } from '@/services/profile.service'

export default function AccountLayout() {
  const logout = useAuthStore((state) => state.logout)
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)

  useEffect(() => {
    profileService.getProfile().then(setProfile).catch(console.error)
  }, [])

  return (
    <div className="pt-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full flex flex-col md:flex-row gap-xl py-xl">
      {/* SideNavBar */}
      <aside className="w-full md:w-80 flex-shrink-0">
        <div className="bg-surface-alt text-primary font-body-md text-body-md h-full w-80 flex flex-col py-lg space-y-md rounded-xl p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-surface-container-high overflow-hidden border border-border-subtle flex items-center justify-center">
              <span className="material-symbols-outlined filled text-4xl text-on-surface-variant">account_circle</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-primary">
                Xin chào, {profile?.fullName || 'Khách hàng'}
              </h2>
              <p className="text-on-surface-variant text-body-sm">
                {profile?.membershipTier || 'Thành viên'}
              </p>
            </div>
          </div>
          <nav className="flex flex-col space-y-2 h-full">
            <NavLink
              to="/account/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 py-3 pl-4 rounded-r-lg transition-all ${
                  isActive
                    ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`
              }
            >
              <span className="material-symbols-outlined">account_circle</span>
              Thông tin tài khoản
            </NavLink>
            <NavLink
              to="/account/orders"
              className={({ isActive }) =>
                `flex items-center gap-3 py-3 pl-4 rounded-r-lg transition-all ${
                  isActive
                    ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`
              }
            >
              <span className="material-symbols-outlined">package_2</span>
              Đơn hàng của tôi
            </NavLink>
            <NavLink
              to="/account/addresses"
              className={({ isActive }) =>
                `flex items-center gap-3 py-3 pl-4 rounded-r-lg transition-all ${
                  isActive
                    ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`
              }
            >
              <span className="material-symbols-outlined">location_on</span>
              Sổ địa chỉ
            </NavLink>
            <NavLink
              to="/account/favorites"
              className={({ isActive }) =>
                `flex items-center gap-3 py-3 pl-4 rounded-r-lg transition-all ${
                  isActive
                    ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`
              }
            >
              <span className="material-symbols-outlined">favorite</span>
              Sản phẩm yêu thích
            </NavLink>
            <button
              onClick={logout}
              className="flex items-center gap-3 py-3 text-on-surface-variant pl-4 hover:bg-surface-container-high transition-all mt-auto pt-8 border-t border-border-subtle"
            >
              <span className="material-symbols-outlined">logout</span>
              Đăng xuất
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex-grow w-full max-w-3xl">
        <Outlet context={{ profile, setProfile }} />
      </section>
    </div>
  )
}
