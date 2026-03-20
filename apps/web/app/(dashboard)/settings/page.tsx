'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, CheckCircle2, Loader2, Monitor, Moon, Sun, School } from 'lucide-react'
import { useTheme } from 'next-themes'
import { api } from '@/lib/api'
import { useUser } from '@/hooks/useUser'
import { clearTokens, storeUser, type AuthUser } from '@/lib/auth'

const inputCls =
  'w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-card'


function AvatarUpload({
  currentAvatar,
  name,
  onUploaded,
}: {
  currentAvatar: string | null | undefined
  name: string
  onUploaded: (url: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displaySrc = preview ?? currentAvatar ?? null
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Seuls les fichiers image sont acceptés')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 Mo")
      return
    }

    setError(null)
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const updated = await api.upload<{
        avatar: string | null
        id: string
        email: string
        password: string
        name: string | null
        plan: string
      }>('/users/me/avatar', formData)
      storeUser({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        plan: updated.plan,
        avatar: updated.avatar ?? null,
        onboardingCompleted: true,
      })
      onUploaded(updated.avatar ?? objectUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload")
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative w-20 h-20 rounded-full flex-shrink-0 cursor-pointer group"
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {displaySrc ? (
          <img src={displaySrc} alt="Avatar" className="w-full h-full rounded-full object-cover" />
        ) : (
          <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-xl">{initials}</span>
          </div>
        )}

        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-white" />
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => !uploading && fileInputRef.current?.click()}
          disabled={uploading}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Upload en cours…' : 'Changer la photo'}
        </button>
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP · Max 5 Mo</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

export default function SettingsPage() {
  const { user, loading, refresh } = useUser()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const initialized = useRef(false)
  useEffect(() => {
    if (user && !initialized.current) {
      setName(user.name ?? '')
      if (user.avatar !== undefined) {
        setAvatar(user.avatar)
      } else {
        api
          .get<AuthUser>('/users/me')
          .then((u) => {
            setAvatar(u.avatar)
            storeUser(u)
          })
          .catch(() => {})
      }
      initialized.current = true
    }
  }, [user])

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileError(null)
    setProfileSuccess(false)

    try {
      const updated = await api.patch<{
        name: string | null
        email: string
        password: string
        plan: string
        id: string
      }>('/users/me', { name: name.trim() || undefined })
      storeUser({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        plan: updated.plan,
        avatar: avatar,
        onboardingCompleted: true,
      })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }

    setSavingPassword(true)
    try {
      await api.patch('/users/me/password', {
        currentPassword: currentPassword || undefined,
        newPassword,
      })
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await api.delete('/users/me')
      clearTokens()
      router.push('/')
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const [inviteCode, setInviteCode] = useState('')
  const [joiningSchool, setJoiningSchool] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [leavingSchool, setLeavingSchool] = useState(false)
  const [schoolName, setSchoolName] = useState<string | null>(null)

  useEffect(() => {
    if (user?.schoolId) {
      api.get<{ name: string } | null>('/schools/current').then((s) => setSchoolName(s?.name ?? null)).catch(() => {})
    }
  }, [user?.schoolId])

  async function handleJoinSchool(e: React.FormEvent) {
    e.preventDefault()
    if (inviteCode.length !== 8) {
      setJoinError('Le code doit contenir 8 caractères')
      return
    }
    setJoiningSchool(true)
    setJoinError(null)
    try {
      const { school } = await api.post<{ school: { name: string } }>('/users/me/join-school', { inviteCode: inviteCode.toUpperCase() })
      setSchoolName(school.name)
      setJoinSuccess(true)
      refresh()
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Code invalide')
    } finally {
      setJoiningSchool(false)
    }
  }

  async function handleLeaveSchool() {
    setLeavingSchool(true)
    try {
      await api.delete('/users/me/school')
      setSchoolName(null)
      setJoinSuccess(false)
      refresh()
    } catch {
    } finally {
      setLeavingSchool(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-card rounded-2xl border border-border p-6 space-y-4 animate-pulse"
          >
            <div className="h-4 bg-secondary rounded w-32" />
            <div className="h-10 bg-secondary rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gérez votre compte
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <h2 className="font-semibold text-sm">Profil</h2>

        <AvatarUpload currentAvatar={avatar} name={name} onUploaded={(url) => setAvatar(url)} />

        <div className="border-t border-border" />

        {profileError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {profileError}
          </div>
        )}
        {profileSuccess && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            Profil mis à jour
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input
              value={user?.email ?? ''}
              disabled
              className={`${inputCls} bg-secondary text-muted-foreground cursor-not-allowed`}
            />
            <p className="text-xs text-muted-foreground/60">
              L&apos;email ne peut pas être modifié.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingProfile}
              className="bg-primary text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingProfile ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <h2 className="font-semibold text-sm">Mot de passe</h2>

        {passwordError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            Mot de passe mis à jour
          </div>
        )}

        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Mot de passe actuel</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground/60">
              Laissez vide si votre compte a été créé via Google.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground/60">Minimum 8 caractères.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword || !newPassword}
            className="bg-primary text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingPassword ? 'Mise à jour…' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-semibold text-sm">Apparence</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              theme === 'light'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sun className="w-4 h-4" />
            Clair
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <Moon className="w-4 h-4" />
            Sombre
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              theme === 'system'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Système
          </button>
        </div>
      </div>

      {user?.role !== 'SCHOOL_ADMIN' && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Mon école</h2>
          </div>

          {user?.schoolId && schoolName ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-secondary rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{schoolName[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{schoolName}</p>
                  <p className="text-xs text-muted-foreground">École associée à votre compte</p>
                </div>
              </div>
              <button
                onClick={handleLeaveSchool}
                disabled={leavingSchool}
                className="text-sm font-medium text-muted-foreground border border-border px-4 py-2 rounded-xl hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {leavingSchool ? 'En cours…' : 'Quitter cette école'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Rejoignez votre école en saisissant le code d&apos;invitation fourni par votre responsable de formation.
              </p>
              {joinError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {joinError}
                </div>
              )}
              {joinSuccess && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Vous avez rejoint {schoolName} !
                </div>
              )}
              <form onSubmit={handleJoinSchool} className="flex gap-3">
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 8))}
                  placeholder="CODE8CAR"
                  maxLength={8}
                  className="flex-1 font-mono tracking-widest border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-card uppercase"
                />
                <button
                  type="submit"
                  disabled={joiningSchool || inviteCode.length !== 8}
                  className="bg-primary text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {joiningSchool ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rejoindre'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-red-200 p-6 space-y-4">
        <h2 className="font-semibold text-sm text-red-600">Zone dangereuse</h2>
        <p className="text-sm text-muted-foreground">
          La suppression de votre compte est définitive. Toutes vos données seront effacées.
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm font-medium text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
          >
            Supprimer mon compte
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Confirmer la suppression ?</span>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {deleting ? '…' : 'Oui, supprimer'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 text-sm font-medium border border-border rounded-xl hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
