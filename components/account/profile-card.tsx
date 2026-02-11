"use client"

import { useState } from "react"
import Image from "next/image"
import { Camera, Calendar, Car, Clock, CheckCircle } from "lucide-react"
import { uploadAvatar } from "@/app/account/actions"
import { toast } from "sonner"

interface ProfileCardProps {
  user: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
    phone: string | null
    date_of_birth: string | null
    address_street: string | null
    address_city: string | null
    address_country: string | null
    created_at: string
  }
  stats: {
    total: number
    upcoming: number
    completed: number
  }
}

function calculateCompletion(user: ProfileCardProps["user"]): number {
  let score = 0
  if (user.full_name) score += 25
  if (user.phone) score += 25
  if (user.date_of_birth) score += 25
  if (user.address_street && user.address_city && user.address_country) score += 25
  return score
}

export function ProfileCard({ user, stats }: ProfileCardProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url)
  const completion = calculateCompletion(user)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    const result = await uploadAvatar(user.id, formData)
    setIsUploading(false)

    if (result.error) {
      toast.error(result.error)
    } else if (result.url) {
      setAvatarUrl(result.url)
      toast.success("Avatar updated successfully")
    }
  }

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="luxury-card profile-card-luxury p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar Section */}
        <div className="relative group">
          <div className="profile-avatar-ring">
            <div className="profile-avatar-inner">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={user.full_name || "User"}
                  width={104}
                  height={104}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-3xl font-medium text-[var(--gold)]">
                  {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-300">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={isUploading}
            />
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-[var(--gold)]" />
            )}
          </label>
        </div>

        {/* Info Section */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-medium text-[var(--text-primary)] mb-1">
            {user.full_name || "Welcome"}
          </h2>
          <p className="text-[var(--text-secondary)] mb-4">{user.email}</p>

          {/* Profile Completion */}
          <div className="mb-4">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-sm text-[var(--text-muted)]">Profile Completion</span>
              <span className="text-sm font-medium text-[var(--gold)]">{completion}%</span>
            </div>
            <div className="w-full max-w-xs mx-auto md:mx-0 h-1.5 bg-[var(--charcoal)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-deep)] transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="flex gap-6 md:gap-8">
          <div className="profile-stat">
            <div className="profile-stat-icon gold">
              <Car className="w-5 h-5 text-[var(--gold)]" />
            </div>
            <p className="text-xl font-semibold text-[var(--text-primary)]">{stats.total}</p>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Total</p>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-icon blue">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-xl font-semibold text-[var(--text-primary)]">{stats.upcoming}</p>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Upcoming</p>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-icon green">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-xl font-semibold text-[var(--text-primary)]">{stats.completed}</p>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Completed</p>
          </div>
        </div>
      </div>

      {/* Member Since */}
      <div className="mt-6 pt-6 border-t border-[var(--gold)]/10 flex items-center justify-center md:justify-start gap-2 text-sm text-[var(--text-muted)]">
        <Calendar className="w-4 h-4" />
        <span>Member since {memberSince}</span>
      </div>
    </div>
  )
}
