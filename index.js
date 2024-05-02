const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const shortid = require('shortid');
const app = express();
const cors = require('cors');
const secret = "urlshortnerbyminku";
app.use(bodyParser.json());
const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const jsonEmailsecret = "theemailsecret";
const mailverifyurl = 'http://localhost:5173/everify';

app.use(cors({
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  origin: '*'
}));

async function connectToDB() {
  try {
    await mongoose.connect("mongodb+srv://aurasoftglow:VI9mWGliGxyzU0NL@cluster0.cjgf1hp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToDB();

const urlSchema = new mongoose.Schema({
  longUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  pageViews: { type: Number, default: 0 }
});

const userSchema = new mongoose.Schema({
  name:String,
  email:String,
  password:String,
  isVerified:{type:Boolean,default:false},

  links:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Link' }]
})

const UrlMapping = mongoose.model('Link', urlSchema);
const User =  mongoose.model('User',userSchema);


    
 async function domail(to,subject,html){

  const transporter = nodemailer.createTransport({
         service:'gmail',
         auth:{
             user:'minkukk602@gmail.com',
             pass:'kkajqryvisegtood'
         }
     })
 
     const mailoption = {
         from:'minkukk602@gmail.com',
         to:to,
         subject:subject,
         html:html
     }
 
     try{
         const sent = await transporter.sendMail(mailoption)
         
     }
     catch(err){
      console.log('sent errr' + err);
     }
 }




    app.post('/register', async (req, res) => {
      try {
      const { name, email, password } = req.body;
   
      const existingUser = await User.findOne({ email });

      if (existingUser) {
          return res.status(409).json({ error: 'User already exists with the same email' });
      }

      const newUser = new User({ name, email, password });
      const savedUser = await newUser.save();
      

      if (savedUser) {
        const mailToken = jwt.sign({ name, email }, jsonEmailsecret, { expiresIn: '1h' });

          const html = `<!DOCTYPE html>
          <html lang="en">
          <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - TinyPath</title>
          <style>
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #e0e8f5;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          }
          .header {
              text-align: center;
              margin-bottom: 30px;
          }
          .header img {
              max-width: 200px;
          }
          .content {
              line-height: 1.6;
              text-align: center;
              color: #333333;
          }
          .verify-btn {
              display: inline-block;
              background-color: #4d7dff;
              color: #ffffff;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 30px;
              font-weight: 500;
              margin-top: 30px;
              transition: background-color 0.3s ease;
          }
          .verify-btn:hover {
              background-color: #2e5ccc;
          }
          .footer {
              margin-top: 40px;
              color: #666666;
              font-size: 14px;
              text-align: center;
          }
          .contact-support {
              color: #4d7dff;
              text-decoration: none;
          }
          </style>
          </head>
          <body>
          <div class="container">
              <div class="header">
                  <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgfmLt9LveGGjCy8uWyoLInrEMqxWaSK3BATWTrZwfvm0n3L7vi3-zU3fYETGm2QN24bg6ukeDW8Zb5l7B0mzZjZ18J0qeafX1TEA0k4e_eEdg2fcadIaM3H8tX8DF4iIeegtI5OV8AuvjJnq7EFOiq3B_HYkaPWfWdq1R4Dczj3IEYyLn_Sf5HrOAQedMv/s500/_b8ad199c-3527-492f-9cef-0a03566845ff-removebg-preview.png" alt="TinyPath Logo">
              </div>
              <div class="content">
                  <h2>Verify Your Email Address</h2>
                  <p>Thank you ${name} for signing up for TinyPath! To complete the registration process and start using our URL shortening service, please verify your email address by clicking the button below:</p>
                  <a href="${mailverifyurl}?token=${mailToken}" class="verify-btn">Verify Now</a>
              </div>
              <div class="footer">
                  <p>This is an auto-generated email. Please do not reply.</p>
                  <p>Need help? <a href="mailto:support@tinypath.com" class="contact-support">Contact Support</a></p>
              </div>
          </div>
          </body>
          </html>`;

          try {
            await domail(email, 'TinyPath Email Verification', html);
            return res.status(200).json({ message: 'Signup successful. Check your email for verification.' });
        } catch (error) {
            console.error('Email sending error:', error);
            return res.status(500).json({ error: 'Failed to send verification email' });
        }


      } else {
          return res.status(500).json({ error: 'Error in creating new account' });
      }
  } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
  }
});

const Tokenverification = async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token not found" });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Failed to authenticate token" });
    }

    req.decoded = decoded;
    next();
  });
};

app.post('/userinfo', Tokenverification, (req, res) => {
  // If the middleware passes, you can access the decoded information from req.decoded
  res.json({ message: req.decoded });
});


app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await User.findOne({ email });

    if (findUser) {
      if (findUser.password === password) {

        const { name, email, _id: id } = findUser;

      if(findUser.isVerified==true){
        const token = await jwt.sign({ name, email, id }, secret);
        res.status(200).json({message:'login success' , name ,email , id , token: token });    
      }
      else{
       const name = await findUser.name;
       const mailToken = jwt.sign({ name, email }, jsonEmailsecret, { expiresIn: '1h' });
       const html = `<!DOCTYPE html>
       <html lang="en">
       <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Verify Your Email - TinyPath</title>
       <style>
       body {
           font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
           background-color: #e0e8f5;
           margin: 0;
           padding: 0;
       }
       .container {
           max-width: 600px;
           margin: 0 auto;
           background-color: #ffffff;
           padding: 30px;
           border-radius: 10px;
           box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
       }
       .header {
           text-align: center;
           margin-bottom: 30px;
       }
       .header img {
           max-width: 200px;
       }
       .content {
           line-height: 1.6;
           text-align: center;
           color: #333333;
       }
       .verify-btn {
           display: inline-block;
           background-color: #4d7dff;
           color: #ffffff;
           text-decoration: none;
           padding: 15px 30px;
           border-radius: 30px;
           font-weight: 500;
           margin-top: 30px;
           transition: background-color 0.3s ease;
       }
       .verify-btn:hover {
           background-color: #2e5ccc;
       }
       .footer {
           margin-top: 40px;
           color: #666666;
           font-size: 14px;
           text-align: center;
       }
       .contact-support {
           color: #4d7dff;
           text-decoration: none;
       }
       </style>
       </head>
       <body>
       <div class="container">
           <div class="header">
               <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgfmLt9LveGGjCy8uWyoLInrEMqxWaSK3BATWTrZwfvm0n3L7vi3-zU3fYETGm2QN24bg6ukeDW8Zb5l7B0mzZjZ18J0qeafX1TEA0k4e_eEdg2fcadIaM3H8tX8DF4iIeegtI5OV8AuvjJnq7EFOiq3B_HYkaPWfWdq1R4Dczj3IEYyLn_Sf5HrOAQedMv/s500/_b8ad199c-3527-492f-9cef-0a03566845ff-removebg-preview.png" alt="TinyPath Logo">
           </div>
           <div class="content">
               <h2>Verify Your Email Address</h2>
               <p>Thank you ${name} for signing up for TinyPath! To complete the registration process and start using our URL shortening service, please verify your email address by clicking the button below:</p>
               <a href="${mailverifyurl}?token=${mailToken}" class="verify-btn">Verify Now</a>
           </div>
           <div class="footer">
               <p>This is an auto-generated email. Please do not reply.</p>
               <p>Need help? <a href="mailto:support@tinypath.com" class="contact-support">Contact Support</a></p>
           </div>
       </div>
       </body>
       </html>`;

       try {
        await domail(email, 'TinyPath Email Verification', html);
        return res.status(403).json({ message: 'Account unverified ! Check your email for verification.' });
      } catch (error) {
        console.error('Email sending error:', error);
        return res.status(500).json({ error: 'Failed to send verification email' });
     }
      }

      } else {
        res.status(401).json({ error: "Invalid password" });
      }
    } else {
      res.status(401).json({ error: 'Unauthorized access' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

  


  app.put('/v1/verification', async (req, res) => {
  try {
      const { token } = req.body;

      jwt.verify(token, jsonEmailsecret, async (err, decoded) => {
          if (err) {
              return res.status(401).json({ error: "Verification failed due to invalid or expired link" });
          } else {
              const email = decoded.email;

            
              const UserFound = await User.findOne({ email: email });

              if (!UserFound) {
                  return res.status(404).json({ error: "Account not found" });
              } else if (UserFound.isVerified) {
                  return res.status(208).json({ message: "User already verified", User: UserFound });
              } else {
                
                  const updatedUser = await User.findOneAndUpdate(
                      { email: email },
                      { isVerified: true },
                      { new: true }
                  );
                  return res.status(200).json({ message: "User verified successfully", User: updatedUser });
              }
          }
      });
  } catch (err) {
      console.log('Internal catch error:', err);
      res.status(500).json({ error: "Internal server error" });
  }
});



app.post('/v1/pageview/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const urlMapping = await UrlMapping.findOne({ shortUrl });
    if (!urlMapping) {
      return res.status(404).json({ error: 'Short URL not found' });
    }
    urlMapping.pageViews++;
    await urlMapping.save();
    res.json({ pageViews: urlMapping.pageViews });
  } catch (error) {
    console.error("Error incrementing page views:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/v1/short-url', async (req, res) => {
  const { longUrl } = req.body;
  const { customLink } = req.body;
  const { userId } = req.body;

  try {
    let shortUrl;
    if (!customLink) {
      shortUrl = shortid.generate(); 
    } else {
      shortUrl = customLink;
    }

    const existingMapping = await UrlMapping.findOne({ shortUrl });
    if (existingMapping) {
      return res.status(409).json({ error: 'Short URL already exists' });
    }

    const newMapping = new UrlMapping({ longUrl, shortUrl });
    await newMapping.save();

    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      user.links.push(newMapping._id);
      await user.save();
    }

    res.status(201).json({ shortUrl });
  } catch (error) {
    console.error("Error creating short URL:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/get-long-url', async (req, res) => {
  const { shortUrl } = req.body;
  try {
    const urlMapping = await UrlMapping.findOne({ shortUrl });
    if (!urlMapping) {
      return res.status(404).json({ error: "URL not found" });
    }
    urlMapping.pageViews++;
    await urlMapping.save(); // Update pageViews
    res.status(200).json({ longUrl: urlMapping.longUrl });
  } catch (error) {
    console.error("Error retrieving long URL:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/userDashboard', Tokenverification, async (req, res) => {
  try {
    const userId = req.decoded.id;
    const user = await User.findById(userId).populate('links');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ links: user.links });
  } catch (error) {
    console.error("Error retrieving user links:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



const PORT =  3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});