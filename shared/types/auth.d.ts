declare module '#auth-utils' {
  interface User {
    discordId: string
    username: string
    avatar?: string | null
  }

  interface UserSession {
    loggedInAt?: string
  }
}

export {}
