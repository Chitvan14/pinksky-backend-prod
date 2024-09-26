# Node.js Application with Firebase Integration

This project is a Node.js application utilizing Firebase and Razorpay for handling various functionalities, including authentication, influencer management, brand management, and campaign management. This README will guide you through setting up the project and accessing its APIs, with a detailed explanation of each endpoint categorized by module.

## Table of Contents

- [Setup](#setup)
- [Packages Used](#packages-used)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Influencer Management](#influencer-management)
  - [Brand Management](#brand-management)
  - [Campaign Management](#campaign-management)
  - [General](#general)

## Setup

1. Clone the repository:

   `git clone https://github.com/pinksky-backend-prod.git`

2. Navigate to the project directory:

   `cd pinksky-backend-prod`

3. Install dependencies:

   `npm install`

4. Set up environment variables by creating a `.env` file with your Firebase, Razorpay, and other required credentials:

```
# CONFIG
NODE_ENV=development
PORT="5000"
BASE_URL="https://{website-url}/api/"
LAUNCHING_MAIL="true"
VERIFY_EMAIL="https://{website-url}/verify"

# FIREBASE CONNECTION
apiKey="your-firebase-api-key"
authDomain="your-firebase-auth-domain"
databaseURL="your-firebase-database-url"
projectId="your-firebase-project-id"
storageBucket="your-firebase-storage-bucket"
messagingSenderId="your-firebase-messaging-sender-id"
appId="your-firebase-app-id"
FIRESTORE_URL="your-firebase-firestore-url"

# INSTAGRAM API
RAPID_USERINFO_URL="https://instagram-scraper-data.p.rapidapi.com/userinfo/"
RAPID_USERINFO_URL_V2="https://rocketapi-for-instagram.p.rapidapi.com/instagram/user/get_info"
RapidAPIHost_V2="rocketapi-for-instagram.p.rapidapi.com"
RapidAPIKey_V2="your-rapidapi-key-v2"
RapidAPIHost="instagram-scraper-data.p.rapidapi.com"
RapidAPIKey="your-rapidapi-key"

# SPREADSHEET
SPREADSHEET="your-spreadsheet-id"
SPREADSHEET_URL="your-google-sheet-url"

# RAZORPAY
KEY_ID="your-razorpay-key-id"
KEY_SECRET="your-razorpay-key-secret"
WEBHOOK_SECRET="your-razorpay-webhook-secret"
MEM_AMOUNT="200000"

# FILTER CODE WORDS
ADMIN_BRAND_FILTER_TEXT="allbranddata"
ADMIN_EVENT_FILTER_TEXT="alleventdata"
ADMIN_COUPON_FILTER_TEXT="allcoupondata"
ADMIN_INFLUENCER_FILTER_TEXT="allinfluencerdata"

# WHATSAPP AND EMAIL INTEGRATION
WAPP_SENDMESSTEXT_UATURL_PRMNTOKN="https://graph.facebook.com/v15.0/{your-facebook-id}/messages"
WAPP_AUTH_PRMNTOKN="your-whatsapp-auth-token"
EML_USER="your-email"
EML_PASS="your-email-password"
EML_PROVIDER="gmail"
EML_HREF_WEBSITE="website-url"
```

5. Set up service accounts by creating a `.json` file with your Firebase:

```
{
 "type": "service_account",
 "project_id": "firebase-project-id",
 "private_key_id": "firebase-project-key",
 "private_key": "firebase-private-key",
 "client_email": "firebase-client-email",
 "client_id": "firebase-client-id",
 "auth_uri": "https://accounts.google.com/o/oauth2/auth",
 "token_uri": "https://oauth2.googleapis.com/token",
 "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
 "client_x509_cert_url": "firebase-cert"
}

```

6. Start the server:

   `npm run dev ##For Development`
   `npm run prod  ##For Production`

## Packages Used

- **Express**: Fast, unopinionated, minimalist web framework for Node.js.
- **Firebase**: Used for database and file storage.
- **Razorpay**: For handling payments.
- **Axios**: Promise-based HTTP client for the browser and Node.js.
- **Cors**: Middleware to enable CORS (Cross-Origin Resource Sharing).
- **Shortid**: For generating unique IDs.
- **Nodemailer**: To send emails from Node.js.
- **SheetDB**: API for Google Sheets as a database.

## API Endpoints

### Authentication

| Method                                                                   | Endpoint                      | Description                        |
| ------------------------------------------------------------------------ | ----------------------------- | ---------------------------------- |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/signin`                 | Sign in to the platform.           |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/forgotpassword`         | Request password reset.            |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/signin/profileupdating` | Update user profile after sign-in. |

### Influencer Management

| Method                                                                   | Endpoint                                    | Description                               |
| ------------------------------------------------------------------------ | ------------------------------------------- | ----------------------------------------- |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/influencer`                           | Create new influencer record.             |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/influencer/create`                    | Create a new influencer with file upload. |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/influencer/update`                    | Update an influencer's details.           |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/mappinginfluencerwithcampaign/update` | Map influencer to a campaign.             |

### Brand Management

| Method                                                                   | Endpoint             | Description                      |
| ------------------------------------------------------------------------ | -------------------- | -------------------------------- |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/brand`         | Create new brand record.         |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/brand/create`  | Create a brand with file upload. |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/brand/update`  | Update brand details.            |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/brand/advance` | Create advanced brand record.    |

### Campaign Management

| Method                                                                   | Endpoint                     | Description                       |
| ------------------------------------------------------------------------ | ---------------------------- | --------------------------------- |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/campaign`              | Create new campaign.              |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/campaign/create`       | Create campaign with file upload. |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/campaign/update`       | Update an existing campaign.      |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/removecampaign/update` | Remove a campaign.                |

### General

| Method                                                                   | Endpoint                     | Description                                 |
| ------------------------------------------------------------------------ | ---------------------------- | ------------------------------------------- |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/testaccount`           | Test account functionality.                 |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/firebasetospreadsheet` | Sync Firebase data to a Google Spreadsheet. |
| ![#0000FF](https://via.placeholder.com/15/0000FF/000000?text=+) **GET**  | `/api/spreadsheettofirebase` | Sync Google Spreadsheet data to Firebase.   |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/spreadsheet/reset`     | Reset spreadsheet data.                     |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/acceptstatus/update`   | Update the status to accept.                |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/rejectstatus/update`   | Update the status to reject.                |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/gallery/update`        | Update the gallery record.                  |

## Razorpay Integration

Several endpoints in the project are used for managing Razorpay payments and subscriptions:

| Method                                                                   | Endpoint                         | Description                           |
| ------------------------------------------------------------------------ | -------------------------------- | ------------------------------------- |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/verify/razorpay`           | Verify a Razorpay payment.            |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/subscription/razorpay`     | Create a subscription using Razorpay. |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/getcouponmessage/razorpay` | Retrieve Razorpay coupon message.     |

## License

This project is licensed under the MIT License.
