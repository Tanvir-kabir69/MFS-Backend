# 📖 Project Name: Mobile Financial Service (MFS)

## 🎯 Objective

Develop a **MFS System** using **Express**, **TypeScript**, and **MongoDB (via Mongoose)**.

***

## 🌍[LIVE LINK](https://mfs-kappa.vercel.app/)



---

## 🛠️ Technology Stack

| Category      | Tools                                  |
|---------------|----------------------------------------|
| ⚙️ Runtime   | Node.js                                |
| 🔧 Framework | Express.js                             |
| 🧠 Language  | TypeScript                             |
| 🛢️ Database  | MongoDB + Mongoose                     |
| 🛡️ Security  | jwt, bcrypt                            |
| 📦 Others    | cors, cookie-parser, zod, dotenv, etc. |

***

## 📌 Minimul Project Overview

- ✅ JWT-based login system(role based) with : `SUPER ADMIN`, `ADMIN`, `AGENT`, `USER`
- ✅ Secure password hashing (using bcrypt)
- ✅ Each user and agent must have a wallet automatically created at registration (e.g., initial balance: ৳50 or set manually via env variables)
- ✅ Users are able to:
    - Add money (top-up)
    - Withdraw money
    - Send money to another user
    - View transaction history
- ✅ Agents are able to:
    - Add money to any user's wallet (cash-in)
    - Withdraw money from any user's wallet (cash-out)
    - View their commission history.
- ✅ Admins are able to:
    - Perform User, Agent and Admin Operations
    - View all users, agents and transactions. But not wallet(Its Users Personal Information)
    - Block/unblock user (By blocking user Wallet is blocked aytomatically)
    - Approve/suspend agents
- ✅ Super Admin is able to:
    - Perform Admin and Agent Operations
    - Set system parameters (e.g., transaction fees) (optional)
- ✅ All transactions are **stored and trackable**
- ✅ Role-based route protection is implemented

---
***

## 🧠 Questions and Answering Guides

*Consider these questions and answers carefully before testing this system. They will make you understand system architecture and logic.*

### 🏦 Wallet Creation & Management

- How will wallets be created?
    - Automatically during registration.
- What happens during registration?
    - users get an wallet automatically.
    - users will have the initial balance that set `SUPER ADMIN`
- Can users inactivate wallets?
    - user can not directly inactivate/activate his wallet. But by by being inactivate/active they can make their wallet inactivate/active.
- What happens when a wallet is blocked?
    - wallet can not be blocked automatically. Admin or Super Admin Blocks/Unblocks an User. If the user is blocked, its wallet is supposed to be blocked. So, the user can not perform any transaction throw their wallet.

---

### 🔁 Transaction Management

- What fields are essential?
    - receiverEmail, amount, transaction_type is required
- How will be handled transaction status?
    - transaction will either successful or cancelled.
- What about atomic operations?
    - Transaction,  Charges and Commissions are handeled automatically during a transaction.

---

### 👥 Role Representation

- How will be distinguished between users, agents, and admins?
    - Single User model with a role field.
    - No Separate models for all roles with shared authentication.
- What unique fields does each need?
    - Agents: commission rate, approval status maintained throw request and request approoval by higher authority.
    - Admins: permission levels are handeled by internal middlewares and functionality. 
- How will agent approval work?
    - Agent will place an agent role request, if the request is accepted by admin or super admin, then they will play agent role.
- How will Admin approval work?
    - Admin will place an Admin role request, if the request is accepted by super admin, then they will play Admin role.

---

### 🫆 Validations & Business Rules

- What validations will be enforced?
    - e.g., **insufficient balance**, **non-existent receiver**, **negative amounts**
- Can a user **send/withdraw** from a blocked wallet?
    - If an user is blocked, his wallet is also blocked, so, not possible.
- Can agents perform cash-in/out for blocked user wallets? What should happen if attempted?
    - No, agent can not. If they try, they will not success and get error.
- Will there be **minimum balance** requirements?
    - No, their is no minimum balance requirements. Your money is your asset. As long as you have money. You can use them.

---

### **📜 Access & Visibility**

- How will users/agents access their **wallet and transaction history**?
    - Throw their transaction history api. transaction_type query supported.
- Can a user view **other users’ wallets or history**? (Why/Why not?)
    - None but the user can see their wallet amount.
    - Wallet is users Personal and it should be kept secret.
- What can **admins** see?
    - All users/agents
    - All transactions

---
***

## 💜 [Exceptional Features:]()

- **Transaction `fee` system** 
- **Agent `commissions`**
- **`Daily limit` for agent and users**
- **`Notification` system `console-based`**
- **Agent-based `cash-in/cash-out` support**

---
***

## 🛠️Project Setup

1. Download or clone repository
2. Open the project with a code editor 
3. Install the dependencies in package.json file
4. Create .env file in root of the project, then copy all environment variables from .env.example file and setup .env file filling up all necessary env variables.
5. Open terminal and run "npm run dev"
6. Export postman.json to the postman for API testing
7. Now you are ready to go.
8. Test API

##
***
***

# ✨ API Testing(Postman)

***

## ⁉️ How to get stared?

The proper way to use this service is to become an `USER` of this system. So, let's be an `USER` 
##


### 1\. Register as an user :

**POST** `api/v1/user/register`

#### Request:

```json
<!-- These are required fields -->
{
    "name" : "Tanvir",
    "email" : "example@gmail.com",
    "password" :"Ex@12345678",
    "phone": "01500000000"
}
```
* provide a valid user `name`
* `email` must be `unique`
* password should be `secured`
* `phone` number must be valid `Bangladeshi` number
* default `role` of an user is automatically `USER` handeled by database.
* `USER` can place request for `AGENT` and `ADMIN`, which is approoved by appropriate authority but no specific collection is created for `AGENT` and `ADMIN` in database.
* an `WALLET` is created automatically in the database after creating an user successfully, which `INITIAL BALANCE` is handeled by assign a value in the `ENVIRONMENT`

### ✅After successful register, you can now :
* See your `Profile`. **GET:** `api/v1/user/me`
* `Update` your profile `name`, `phone`, `address`. **PATCH:** `api/v1/user/:userId`
### ⚠️But before that, you must log in to your account.


### 2. Log in as an user :

**POST** `api/v1/auth/login`

#### Request:

```json
<!-- These are required fields -->
{
    "email" : "example@gmail.com",
    "password" :"Ex@12345678"
}
```
* provide your valid `email` and `password` to log in successfully.

### 3. Alternative to create user and login(Google Login)
If you just want to avoid create an account and log in, you can just continue with `Google`

* **GET** `api/v1/auth/google`
* Login from google `oauth` page with your `google account`
* You will automatically have an `user profile` and `Wallet` 

### ✅After successful login, you can now :
* `CASH IN` into your `WALLET` from an `AGENT` or higher authority like `ADMIN` or `SUPER ADMIN`. See details in `Transaction` section.
* `CASH OUT` from your `WALLET` from an `AGENT` or higher authority like `ADMIN` or `SUPER ADMIN` but `CHARGE` applicable. See details in `Transaction` section.
* `SENT MONEY` from your wallet to other `USER`, `AGENT` or higher authority like `ADMIN`, `SUPER ADMIN` but `CHARGE` applicable. See details in `Transaction` section.
* See your ``Profile. **GET:** `api/v1/user/me`
* See your wallet `balance`. **GET:** `api/v1/wallet/my-balance`
* Update your profile `name`, `phone`, `address`. **PATCH:** `api/v1/user/:userId`
* Can request for higher authority like `AGENT` or `ADMIN`. See details in `Role Management` section.
* Can get new access token. **POST:** `api/v1/auth/access-token`
* Can `Change Password`. **POST:** `api/v1/auth/change-password`. Details in `Postman`
* Or can **`Log Out`**. **POST:** `api/v1/auth/logout`

***


## 🤔 How to get upgraded in `AGENT` or `ADMIN` 

### 1. Request for Agent Role

**POST** `api/v1/roleController/request-agent`

#### Request:

```json
<!-- These are required fields -->
// log in and then place your _id in the following user_id
{
  "user_id": "68a590b6eebe71cbac74176d"
}
```
* Only `USER` is allowed to submit an `AGENT` request.
* `AGENT` is already in agent role. So, his request will cancelled automatically.
* `ADMIN ` and `SUPER ADMIN` are higher authority. So, they can automatically handle `AGENT ROLE`. And their request will be cancelled automatically.
* Once request is submitted successfully. An `ADMIN` or `SUPER ADMIN` will `APPROOVE` or `CANCEL` this request. By `APPROOVING` an user will be upgraded as `AGENT`.
* Applicant must be logged in to submit `AGENT REQUEST`.



### 2. Request for Admin Role

**POST** `api/v1/roleController/request-admin`

#### Request:

```json
<!-- These are required fields -->
// log in and then place your _id in the following user_id
{
  "user_id": "68a590b6eebe71cbac74176d"
}
```

* Only `USER` and `AGENT` is allowed to submit an `ADMIN` request.
* `ADMIN` is already in agent role. So, his request will cancelled automatically.
* `SUPER ADMIN` is higher authority. So, he can automatically handle `ADMIN ROLE`.And his request will be cancelled automatically.
* Once request is submitted successfully, `SUPER ADMIN` will `APPROOVE` or `CANCEL` this request. By `APPROOVING` an user or agent will be upgraded as `ADMIN`.
* Applicant must be logged in to submit `AGENT REQUEST`.


***



## ⁉️ How `Agent Requests` are approoved ❓

* Onle `ADMIN` or `SUPER ADMIN` can accept or cancel an agent request.
* `ADMIN` or `SUPER ADMIN`, whoever wants to approove an agent request, he must be `LOGGED IN`.
* He must get the `VALID` agent requests, which are nither `ACCEPTED` nor `CANCELLED`
* Then he either accept the request or cancel.

### 1. Get all valid agent requests

**GET** `api/v1/roleController/all-valid-agent-requests`

#### Request:

* Only `Admin` or `SUPER ADMIN` is allowed to access this request. And they must need to be logged in.

### 2. Accept a valid agent request

**POST** `api/v1/roleController/agent-request-approve`

#### Request:

```json
<!-- These are required fields -->
{
    "request_id": "68addacf76183d5b14a51ee4"
}
```
* The value of `request_id` is the value of a valid agent request's _id, retrived from all valid agent requests.
* Only `Admin` or `SUPER ADMIN` is allowed to accept a valid agent request. And they must need to be logged in.

### 3. Cancel a valid agent request

**POST** `api/v1/roleController/agent-request-cancel`

#### Request:

```json
<!-- These are required fields -->
{
    "request_id": "68addacf76183d5b14a51ee4"
}
```
* The value of `request_id` is the value of a valid agent request's _id, retrived from all valid agent requests.
* Only `Admin` or `SUPER ADMIN` is allowed to cancel a valid agent request. And they must need to be logged in.


***



## ⁉️ How `Admin Requests` are approoved ❓

* `SUPER ADMIN` can accept or cancel an agent request.
* `SUPER ADMIN`, whoever wants to approove an agent request, he must be `LOGGED IN`.
* He must get the `VALID` admin requests, which are nither `ACCEPTED` nor `CANCELLED`
* Then he either accept the request or cancel.

### 1. Get all valid admin requests

**GET** `api/v1/roleController/all-valid-admin-requests`

#### Request:

* Only `SUPER ADMIN` is allowed to access this request. And he must need to be logged in.

### 2. Accept a valid admin request

**POST** `api/v1/roleController/admin-request-approve`

#### Request:

```json
<!-- These are required fields -->
{
    "request_id": "68addacf76183d5b14a51ee4"
}
```
* The value of `request_id` is the value of a valid admin request's _id, retrived from all valid admin requests.
* Only `SUPER ADMIN` is allowed to accept a valid agent request. And he must need to be logged in.

### 3. Cancel a valid admin request

**POST** `api/v1/roleController/admin-request-cancel`

#### Request:

```json
<!-- These are required fields -->
{
    "request_id": "68addacf76183d5b14a51ee4"
}
```
* The value of `request_id` is the value of a valid admin request's _id, retrived from all valid admin requests.
* Only `SUPER ADMIN` is allowed to cancel a valid agent request. And he must need to be logged in.


***

## 🤔 How to get all `ADMIN`, `AGENTS` Or `USERS` ?

### 1. Get all `ADMINS`

**GET** `api/v1/roleController/all-admins`

* Only `SUPER ADMIN` is allowed to `GET ALL ADMIN` . And he must need to be logged in.

### 2. Get all `AGENTS`

**GET** `api/v1/roleController/all-agents`

* Both  `SUPER ADMIN` and `ADMIN` are allowed to `GET ALL AGENTS` . And they must need to be logged in.

### 3. Get all `USERS`

**GET** `api/v1/roleController/all-users`

* Both  `SUPER ADMIN` and `ADMIN` are allowed to `GET ALL USERS` . And they must need to be logged in.


***

## 💁How `Restriction Control` works ?
* By an `USER` doing `ACTIVE` or `INACTIVE` his account.
* Applying `BLOCKED` or `UNBLOCKED` on an user by `ADMIN` or `SUPER ADMIN`

### 1. How to `ACTIVE` or `INACTIVE` your account ?

**POST** `api/v1/restriction/activity-control`

#### Request:

```json
<!-- These are required fields -->
{
    "action": "ACTIVE"
    // "action": "INACTIVE"
}
```
* action = `ACTIVE` || `INACTIVE`
* Only `USER` and `AGENT` can perform this request. And they myst be loged in.
* `ADMIN` and `SUPER ADMIN` can not perform this request, because the have higher authority tasks and `INACTIVE` may efect on this process.
* `ACTIVE USER` can not perform `ACTIVE` request. And vice varsa. 

### 2. How to apply `BLOCKED` and `UNBLOCKED` on a user account ?

**POST** `api/v1/restriction/blocking-control`

#### Request:

```json
<!-- These are required fields -->
{
  "requestEmail": "tanvirkaabirrrrrrrrrrrrR@gmail.com",
  "action": "BLOCKED"
//   "action": "UNBLOCKED"
}
```
* action = `BLOCKED` || `UNBLOCKED`
* ONLY `SUPER ADMIN` AND `ADMIN` are permitted to `BLOCK` || `UNBLOCK`
* `SUPER ADMIN` is `never` allowed to be blocked/unblocked
* `ADMIN` is not allowed to perform `another ADMIN`  blocking/unblocking
* If requested user is `INACTIVE` , he can not be BLOCKED/UNBLOCKED
* You can not `UNBLOCK` an USER who is not `BLOCKED`
* You can not `BLOCK` an USER who is already `BLOCKED`. And vice varsa.

### Get `INACTIVE` users:

**GET:** `api/v1/restriction/inactive-users`

* Only `ADMIN` and `SUPER ADMIN` can access these users.

### Get `BLOCKED` users:

**GET:** `api/v1/restriction/blocked-users`

* Only `ADMIN` and `SUPER ADMIN` can access these users.

***


## 🔁💲Transaction

### 1. How to do transaction?

**POST** `api/v1/transaction`

#### Request:

```json
<!-- These are required fields -->
// SENT MONEY  VIA USER TO USER
{
  "receiverEmail": "tanvirkaaabirrrrrrrrrrrrR@gmail.com",
  "amount": 10,
  "transaction_type": "SENT_MONEY"
}
```
* `Receiver Email` should be provide accurately.
* `Transaction Type` and their details are discussed later. Also `description` in `Postman`. User must needed to logged in.

### 2. How to get my all transaction history?

**GET** `api/v1/transaction/my-transactions`

* Only you will get the transactions, you were permitted to perform, ant that thransactions happended using your email. User must needed to logged in.

### 3. How to get my all commissions history?

**GET** `api/v1/transaction/my-commissions`

* Only you will receive the commission history, you were paid by the `SUPER ADMIN` or `COMPANY`. User must needed to logged in.

### 4. How to get all commissions history?

**GET** `api/v1/transaction/all-transactions`

* Only `SUPER ADMIN` and `ADMIN` are allowed to access all transactions. User must needed to logged in.

***
***



# 📖 Explanation of `Transaction` and `Transaction Type`


| Transaction Type       | Sender(Paywe)             | Receiver                  | Handelation                      | Charge |      Charge Name       | Charge Payer | Charge Receiver | Commission | Commission Name            | Commission Payer | Commission Receiver |
|------------------------|---------------------------|---------------------------|----------------------------------|--------|------------------------|--------------|-----------------|------------|----------------------------|------------------|---------------------|
| ADMIN LOAD             | SUPER ADMIN               | ADMIN                     | Manually Throw Request           |   ❌   |         ❌            |    ❌       |       ❌        |     ❌    |         ❌                 |        ❌        |        ❌          |
| ADMIN LOAD             | ADMIN                     | SUPER ADMIN/ ADMIN        | Manually Throw Request           |   ❌   |         ❌            |    ❌       |       ❌        |     ❌    |         ❌                 |        ❌        |        ❌          |
| AGENT LOAD             | SUPER ADMIN / ADMIN       | AGENT                     | Manually Throw Request           |   ❌   |         ❌            |    ❌       |       ❌        |     ❌    |         ❌                 |        ❌        |        ❌          |
| AGENT UNLOAD           | AGENT                     | AGENT/ ADMIN/ SUPER ADMIN | Manually Throw Request           |   ❌   |         ❌            |    ❌       |       ❌        |     ❌    |         ❌                 |        ❌        |        ❌          |
| CASH IN                | Anyone except USER        | USER                      | Manually Throw Request           |   ✅   | CASH IN CHARGE         |   Sender    | SUPER ADMIN      |     ✅    | CASH IN COMMISSION         |  SUPER ADMIN     | Sender              |
| CASH OUT               | USER                      | Anyone except USER        | Manually Throw Request           |   ✅   | CASH OUT CHARGE        |   Sender    | SUPER ADMIN      |     ✅    | CASH OUT COMMISSION        |  SUPER ADMIN     | Receiver            |
| SENT MONEY             | Anyone                    | Anyone                    | Manually Throw Request           |   ✅   | SENT MONEY CHARGE      |   Sender    | SUPER ADMIN      |     ✅    | SENT MONEY COMMISSION      |  SUPER ADMIN     | Sender              |
| CASH IN CHARGE         | Sender in Cash In         | SUPER ADMIN               | Automatically During Cash in     |   ❌   |         ❌            |    ❌       |       ❌        |     ❌    |         ❌                 |        ❌        |        ❌          |
| CASH OUT CHARGE        | Sender in Cash Out        | SUPER ADMIN               | Automatically During Cash OUT    |   ❌   |         ❌            |    ❌       |       ❌        |     ❌    |         ❌                 |        ❌        |        ❌          |
| SENT MONEY CHARGE      | Sender in Sent Money      | SUPER ADMIN               | Automatically During Sent Money  |   ❌   |         ❌            |    ❌       |       ❌        |     ❌    |         ❌                 |        ❌        |        ❌          |
| CASH IN COMMISSION     | SUPER ADMIN               | Sender in Cash In         | Automatically During Cash in     |   ❌   |         ❌            |    ❌       |       ❌        |     ❌    |         ❌                 |        ❌        |        ❌          |
| CASH OUT COMMISSION    | SUPER ADMIN               | Receiver in Cash Out      | Automatically During Cash Out    |   ❌   |         ❌            |    ❌       |       ❌        |     ❌    |         ❌                 |        ❌        |        ❌          |
| SENT MONEY COMMISSION  | SUPER ADMIN               | Sender in Sent Money      | Automatically During Sent Money  |   ❌   |         ❌            |    ❌       |       ❌        |     ❌    |         ❌                 |        ❌        |        ❌          |


***
***


## ✨ LIVE LINK:

*  🌍 **LIVE LINK:** [MFS Backend Live Link](https://mfs-kappa.vercel.app/)

***
***

