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

   ``git clone https://github.com/your-repo.git``

2. Navigate to the project directory:

   ``cd your-project``

3. Install dependencies:

   ``npm install``

4. Set up environment variables by creating a `.env` file with your Firebase, Razorpay, and other required credentials:

   ``env
   PORT=your_port
   FIREBASE_API_KEY=your_firebase_api_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   SPREADSHEET=your_google_sheet_link
   ``

5. Start the server:

   ``npm start``

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

| Method   | Endpoint                          | Description                                             |
|----------|-----------------------------------|---------------------------------------------------------|
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/signin`                        | Sign in to the platform.                                 |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/forgotpassword`                | Request password reset.                                  |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/signin/profileupdating`        | Update user profile after sign-in.                       |

### Influencer Management

| Method   | Endpoint                              | Description                                             |
|----------|---------------------------------------|---------------------------------------------------------|
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/influencer`                      | Create new influencer record.                            |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/influencer/create`               | Create a new influencer with file upload.                |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/influencer/update`               | Update an influencer's details.                          |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/mappinginfluencerwithcampaign/update` | Map influencer to a campaign.                     |

### Brand Management

| Method   | Endpoint                          | Description                                             |
|----------|-----------------------------------|---------------------------------------------------------|
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/brand`                         | Create new brand record.                                 |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/brand/create`                  | Create a brand with file upload.                         |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/brand/update`                  | Update brand details.                                    |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/brand/advance`                 | Create advanced brand record.                            |

### Campaign Management

| Method   | Endpoint                              | Description                                             |
|----------|---------------------------------------|---------------------------------------------------------|
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/campaign`                      | Create new campaign.                                     |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/campaign/create`               | Create campaign with file upload.                        |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/campaign/update`               | Update an existing campaign.                             |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/removecampaign/update`         | Remove a campaign.                                       |

### General

| Method   | Endpoint                              | Description                                             |
|----------|---------------------------------------|---------------------------------------------------------|
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/testaccount`                    | Test account functionality.                              |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/firebasetospreadsheet`          | Sync Firebase data to a Google Spreadsheet.              |
| ![#0000FF](https://via.placeholder.com/15/0000FF/000000?text=+) **GET**  | `/api/spreadsheettofirebase`          | Sync Google Spreadsheet data to Firebase.                |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/spreadsheet/reset`              | Reset spreadsheet data.                                  |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/acceptstatus/update`            | Update the status to accept.                             |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/rejectstatus/update`            | Update the status to reject.                             |
| ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) **PUT**  | `/api/gallery/update`                 | Update the gallery record.                               |

## Razorpay Integration

Several endpoints in the project are used for managing Razorpay payments and subscriptions:

| Method   | Endpoint                                  | Description                                             |
|----------|-------------------------------------------|---------------------------------------------------------|
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/verify/razorpay`                 | Verify a Razorpay payment.                               |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/subscription/razorpay`           | Create a subscription using Razorpay.                    |
| ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) **POST** | `/api/getcouponmessage/razorpay`       | Retrieve Razorpay coupon message.                        |

## License

This project is licensed under the MIT License.
