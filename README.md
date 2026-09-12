# Nila Mobile website

Independent static website for `nilamobile.com`.

## Preview

Open `index.html` or run a local static server.

## Publish

Upload all files to the root of a GitHub repository, enable GitHub Pages, then point the custom domain to that Pages site. Test the apex and `www` versions before removing the existing host.

## Before taking payments

- Replace the placeholder contact email if required.
- Have the legal pages reviewed for the final business entity and supplier terms.
- Connect checkout to a server-side Stripe endpoint.
- Keep Stripe and supplier API secrets on the server; never place them in `app.js`.
- Replace the placeholder compatibility message with the supplier device catalogue.
