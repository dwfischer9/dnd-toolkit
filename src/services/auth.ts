import { StorageKeys } from '@/types/app'

export const AUTH_USERS_STORAGE_KEY = StorageKeys.AuthUsers
export const AUTH_SESSION_STORAGE_KEY = StorageKeys.AuthSession

export interface AuthUser {
  id: string
  email: string
  displayName: string
  passwordHash: string
  salt: string
  createdAt: string
}

export interface AuthSession {
  userId: string
  createdAt: string
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface CreateAccountInput extends AuthCredentials {
  displayName: string
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

const loadUsers = (): AuthUser[] => {
  const storage = getStorage()
  if (!storage) {
    return []
  }

  try {
    const rawValue = storage.getItem(AUTH_USERS_STORAGE_KEY)
    if (!rawValue) {
      return []
    }

    const parsed = JSON.parse(rawValue) as AuthUser[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveUsers = (users: AuthUser[]) => {
  const storage = getStorage()
  if (!storage) {
    return
  }

  storage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users))
}

const loadSession = (): AuthSession | null => {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  try {
    const rawValue = storage.getItem(AUTH_SESSION_STORAGE_KEY)
    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(rawValue) as AuthSession
    return parsed?.userId ? parsed : null
  } catch {
    return null
  }
}

const saveSession = (session: AuthSession | null) => {
  const storage = getStorage()
  if (!storage) {
    return
  }

  if (!session) {
    storage.removeItem(AUTH_SESSION_STORAGE_KEY)
    return
  }

  storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
}

const hashPassword = async (password: string, salt: string) => {
  const encoder = new TextEncoder()
  const payload = `${salt}:${password}`
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(payload))
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const buildDisplayName = (email: string) => {
  const localPart = normalizeEmail(email).split('@')[0] || 'Adventurer'
  return localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

const validateCredentials = (email: string, password: string) => {
  if (!normalizeEmail(email)) {
    throw new Error('Email is required.')
  }

  if (!password.trim()) {
    throw new Error('Password is required.')
  }
}

export const loadCurrentUser = (): AuthUser | null => {
  const session = loadSession()
  if (!session) {
    return null
  }

  return loadUsers().find((user) => user.id === session.userId) ?? null
}

export const createAccount = async ({
  displayName,
  email,
  password,
}: CreateAccountInput): Promise<AuthUser> => {
  validateCredentials(email, password)

  const normalizedEmail = normalizeEmail(email)
  const users = loadUsers()

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('An account already exists for that email.')
  }

  const salt = crypto.randomUUID()
  const passwordHash = await hashPassword(password, salt)
  const nextUser: AuthUser = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    displayName: displayName.trim() || buildDisplayName(normalizedEmail),
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  }

  saveUsers([nextUser, ...users])
  saveSession({
    userId: nextUser.id,
    createdAt: new Date().toISOString(),
  })

  return nextUser
}

export const signIn = async ({ email, password }: AuthCredentials): Promise<AuthUser> => {
  validateCredentials(email, password)

  const normalizedEmail = normalizeEmail(email)
  const user = loadUsers().find((entry) => entry.email === normalizedEmail)

  if (!user) {
    throw new Error('No account was found for that email.')
  }

  const passwordHash = await hashPassword(password, user.salt)
  if (passwordHash !== user.passwordHash) {
    throw new Error('That password is not correct.')
  }

  saveSession({
    userId: user.id,
    createdAt: new Date().toISOString(),
  })

  return user
}

export const signOut = () => {
  saveSession(null)
}
