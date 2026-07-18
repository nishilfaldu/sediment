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
    // Keep this boring and transactional: code in the subject, no links/HTML.
    // Marketing-y copy + casual subjects push Gmail toward Promotions/Spam.
    const { error } = await resend.emails.send({
      from: 'Sediment <auth@nishilfaldu.site>',
      to: [email],
      subject: `Your Sediment sign-in code: ${token}`,
      text: [
        'Your Sediment sign-in code:',
        '',
        token,
        '',
        'This code expires in 15 minutes.',
        '',
        'If you did not request this, you can ignore this email.'
      ].join('\n'),
      headers: {
        // Reduce Gmail threading OTP mail into older conversations.
        'X-Entity-Ref-ID': `sediment-otp-${token}`
      }
    })

    if (error) {
      throw new Error(JSON.stringify(error))
    }
  }
})
