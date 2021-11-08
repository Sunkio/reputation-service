// import config from "src/config"
// import {addUnverifiedUser } from  '../../../utils/email/mongo_add_user';
// import {checkUserStatus } from '../../../utils/email/mongo_check_user';
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next"
import { withSentry } from "@sentry/nextjs"
import createEmailAccount from "src/core/email/createEmailAccount"
import logger from "src/utils/backend/logger"


async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {

	console.log("**********Checking address & sending email************")
	logger.silly(`Request: ${req.body}`)

	const { address } = JSON.parse(req.body)
	const userEmail = address
	console.log(userEmail)
	console.log("Email address: ",userEmail)
	var message

	// -------------------checking email format-----------------
	if(!userEmail || userEmail.includes("@hotmail") != true){
		message = "invalid email, must be an @hotmail address"
        return res.status(402).json({ message })
	}

	// -------------------checking user is new-----------------
	try {
		console.log("trying to make account")
		await createEmailAccount(userEmail, "hotmail").then((message) => {
			console.log("createEmailAccount message", message)
			return res.status(200).json({message})
		})

	} catch (err) {
		console.log(err)
	}

}

export default withSentry(handler as NextApiHandler)
