const nodemailer = require('nodemailer')

const sendMail = async (recieverMail,subjectofMail, body) => {
    let testAccount = await nodemailer.createTestAccount();
  
    // connect with the smtp
    let transporter = await nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "kaylah.olson@ethereal.email",
        pass: "HCSK2bwKfbfuaFNs74",
      },
    });

    let info = await transporter.sendMail({
      from: 'haseebsajid25100@gmail.com',
      to: recieverMail, 
      subject: subjectofMail, 
      text:  body
    });
    console.log(recieverMail)
    console.log("Message sent: %s", info);
  };
  
  module.exports = sendMail;