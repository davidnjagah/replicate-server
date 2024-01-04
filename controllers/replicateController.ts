import Replicate from "replicate";
import { Request, Response, NextFunction } from 'express';
import HttpError from "../models/errorModel";
import { Resend } from "resend";
import prismadb from "../lib/prismadb";
import * as dotenv from 'dotenv';
dotenv.config();

let replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN
});

let userID = "";

export const replicateResend = async (
    req: Request,
    res: Response,
    next: NextFunction
    ) => {

      try {

        if(!replicate){
            replicate = new Replicate({
              auth: 'r8_L11WlZKygboMmGR2g0luxznTyx62fie2jAmlT'
          });
        }

        const resend = new Resend(process.env.RESEND_API_TOKEN);

        const { template, imageUrl, email, userId, userEmail } = req.body;

        if (!imageUrl && !template && !email) {
            return next(new HttpError("ImageUrl, template and userEmail are unavailable.", 500));
        }
        userID = userId
        console.log("imageurl:", imageUrl);
        console.log("template:", template);
        console.log("email:", email);

        res.status(200);
        
        const output = await replicate.run(
          "catio-apps/photoaistudio-generate:1ed8b5810e1e4291699e6a43ef9c641196d660eae7cba314d83519a898a409da",
          {
                input: {
                  seed: 1,
                  steps: 8,
                  width: 1080,
                  prompt: template.prompt,
                  n_prompt: "ugly, bad hair, baggy, blurry",
                  face_image: imageUrl,
                  pose_image: template.uri,
                  num_samples: 1,
                  face_resemblance: 0.5,
                  pose_resemblance: 0.8,
                  face_expanding_bbox: 0.5
                }
              }
          );

          if(!output){
            return res.status(400);
          }

          //add functionality to show generations that aborted through generation table

          await prismadb.generations.create({
            data: {
                userId,
                email,
                imageurl: `${output}` 
            }
          }); 

        const { data, error } = await resend.emails.send({
            from: "Genius Ai <onboarding@resend.dev>",
            to: [`${email}`],
            subject: "Your Headshot Generation",
            html: `<strong> Here is your headshot generation image ${output}.</strong><p>Thank you for using Genius Ai.</p>`,
          });
          
          if (error) {
            return res.status(400).json({ error });
          } 

        console.log("This is the resend data",data);

        const userApiLimit = await prismadb.userApiLimit.findUnique({
            where: {
                userId
            }
        });
        if (userApiLimit) {
            await prismadb.userApiLimit.update({
                where: { userId },
                data: { count: userApiLimit.count + 1 },
            });
        } else {
            await prismadb.userApiLimit.create({
                data: { userId: userId, userEmail: userEmail, count: 1}
            });
        }

   return res.status(200).json("Email sent successfully");

  } catch (error) {
    const userApiLimit = await prismadb.userApiLimit.findUnique({
      where: {
          userId: userID
      }
    });
    if (userApiLimit) {
      await prismadb.userApiLimit.update({
          where: { userId: userID },
          data: { count: userApiLimit.count - 1 },
      });
    }
    console.log("[REPLICATE_SERVER_ERROR]", error);
    return next(new HttpError("Something went wrong.", 500));
  }
}