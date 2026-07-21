// scripts/register-pesapal-ipn.ts
// Run once after deploying: npx tsx scripts/register-pesapal-ipn.ts
// Save the printed ipn_id as PESAPAL_IPN_ID in your environment variables.
import { registerIPN } from '../lib/pesapal'

registerIPN(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/pesapal/ipn`)
  .then((result) => console.log('Save this as PESAPAL_IPN_ID:', result.ipn_id))
  .catch(console.error)