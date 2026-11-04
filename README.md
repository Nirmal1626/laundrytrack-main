# LaundryTrack

Laundry counter dashboard and customer order portal, branded by Nirmal Kumar.

Each order gets a private tracking link. Creating an order, or moving it to the next step, opens WhatsApp with that link ready to send to the phone number on the ticket. If Twilio is configured, the same message is sent through the gateway as well.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Unauthenticated visitors are redirected to `/login`.

## Accounts

Roles come from the email address.

| Role | Email |
| --- | --- |
| Owner | rkp16feb2006@gmail.com |
| Counter staff | rishabhempirewow@gmail.com |
| Counter staff | collegestudies1626@gmail.com |
| Customer | Any other email saved on an order |

The first time a staff account signs in, it chooses its own password. Customers can create an account at `/signup` with their name, email, and password, then sign in to see orders associated with their email. To set a shared initial password for all accounts currently in the store, set `INITIAL_ACCOUNT_PASSWORD` in `.env.local` and use the app once. It must be at least 8 characters; each account gets a separately salted password hash. This one-time initialization resets existing account passwords, so remove the variable afterward. Accounts created later continue to choose their own passwords. Customers can also open the tracking link from WhatsApp without signing in.

Owner can access all dashboard sections. Counter staff can use Orders and Customers.

## Tracking and WhatsApp

- New orders ask for a customer email and a WhatsApp number.
- The tracking page is `/track/<private-token>` and does not require a login.
- The page refreshes while it is open, so a status change at the counter shows up for the customer.
- Without Twilio, press **Send on WhatsApp**. That opens a chat to the customer’s number with the tracking link filled in.
- With `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_NUMBER` set, the server sends the message itself.

Copy `.env.example` to `.env.local` and set `JWT_SECRET` to a unique random value of at least 32 characters. Set `APP_URL` when the public site address is different from the address the server sees. Never commit `.env.local`.

## Stored data

Orders, expenses, and password hashes are saved in `data/store.json` on the server. That file is local to this machine. Use a hosted database before putting real customer data on a shared server.
