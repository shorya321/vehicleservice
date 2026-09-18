"use client"

import { useState } from "react"
import Image from "next/image"
import { Camera } from "lucide-react"
import { toast } from "sonner"
import { uploadAvatar } from "@/app/account/actions"

interface AvatarUploadProps {
  userId: string
  fullName: string | null
  email: string
  avatarUrl: string | null
}

/**
 * The profile photo and its upload control.
 *
 * Lifted out of the rail unchanged. The rail sat directly beneath a page header carrying the
 * same name and email, so it was showing the customer their own identity twice; it is pure
 * navigation now, and the photo moved here, beside the other fields it belongs with.
 */
export function AvatarUpload({ userId, fullName, email, avatarUrl: initialUrl }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(initialUrl)

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

    const result = await uploadAvatar(userId, formData)
    setIsUploading(false)

    if (result.error) {
      toast.error(result.error)
    } else if (result.url) {
      setAvatarUrl(result.url)
      toast.success("Avatar updated")
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative group flex-shrink-0">
        <div className="account-avatar-ring">
          <div className="account-avatar-inner">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName || "User"}
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-base font-medium text-[var(--gold-text)]">
                {fullName?.charAt(0)?.toUpperCase() || email.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <label
          className="absolute inset-0 flex items-center justify-center bg-[var(--onyx)]/60 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 cursor-pointer transition-opacity duration-200"
          aria-label="Upload profile photo"
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleAvatarUpload}
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-4 h-4 text-[var(--gold)]" aria-hidden="true" />
          )}
        </label>
      </div>
      <div className="min-w-0">
        <p className="account-label">Profile photo</p>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
          Optional. Hover the circle to replace it. JPG or PNG, up to 5MB.
        </p>
      </div>
    </div>
  )
}
