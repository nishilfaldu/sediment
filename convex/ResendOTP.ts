import { Email } from '@convex-dev/auth/providers/Email'
import { RandomReader, generateRandomString } from '@oslojs/crypto/random'
import { Resend as ResendAPI } from 'resend'

export const ResendOTP = Email({
  id: 'resend-otp',
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 15, // 15 minutes
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes)
      }
    }

    const alphabet = '0123456789'
    const length = 8
    return generateRandomString(random, alphabet, length)
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey as string)
    const { error } = await resend.emails.send({
      from: 'Sediment <auth@nishilfaldu.site>',
      to: [email],
      subject: 'your sediment code',
      text: [
        'hey — here’s your sign-in code:',
        '',
        token,
        '',
        'it expires in 15 minutes.',
        '',
        'if that wasn’t you, you can ignore this.',
        '',
        '— nishil'
      ].join('\n')
    })

    if (error) {
      throw new Error(JSON.stringify(error))
    }
  }
})
