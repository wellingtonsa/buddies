
require('dotenv').config();
const fs = require('fs');
const nodemailer = require("nodemailer");   
const date = require("date-fns");
const { ptBR } = require('date-fns/locale');
const axios = require("axios");
const api = require("./api").default;
const express = require("express");
const cors = require("cors");
const cron = require('node-cron');

async function init(){

  const app = express();

  app.use(express.json());
  app.use(cors());

    // Download invoice file
    const invoiceMonth = date
    .startOfDay(date.sub(new Date(), { months: 1})
    .setUTCDate(1))
    .toISOString();

    async function generateInvoice(){
      const query = {
        dateRangeStart: invoiceMonth,
        dateRangeEnd: date
        .endOfDay(date.setDate(invoiceMonth, date.getDaysInMonth(invoiceMonth) - 1)).toISOString(),
        detailedFilter: {},
        projects: {
          ids: [process.env.PROJECT_ID]
        },
        exportType: "PDF"
    }

    const response = await axios
    .post(
        'https://reports.api.clockify.me/v1/workspaces/66904073725b056bd719fcf8/reports/detailed',
        query,
        {
            headers: {
                'X-Api-Key': process.env.CLOCKIFY_API_KEY,
            },
            responseType: 'arraybuffer'
        }
    )

    // save invoice file
    fs.writeFileSync('invoice.pdf', response.data, "binary", function () {});
    }

    async function sendInvoiceViaEmail(){
      //configure email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for port 465, false for other ports
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: process.env.TARGET_EMAIL,
      cc: process.env.CC_EMAIL || '',
      priority: 'high',
      subject: `Invoice ${date.format(invoiceMonth, 'MMMM', { locale: ptBR })} - Wellington Araújo`.toUpperCase(),
      html: `
        <p>Olá, está é uma mensagem automática do meu bot de invoice, Buddy! Estou te enviando o invoice referente ao mês de <strong>${date.format(invoiceMonth, 'MMMM', { locale: ptBR })}</strong></p>
        <p>Segue em anexo, o PDF contendo o resumo de horas trabalhadas no projeto.</p>
        <br>
        <strong>Att.,</strong>
        <br>
        <strong>Wellington Araújo - Via bot Buddy</strong>
      `,
      attachments: [
          { 
              filename: `Invoice - ${date.format(invoiceMonth, 'MMMM', { locale: ptBR })}.pdf`,
              path: './invoice.pdf'
          },
      ]
    };

    //send invoice
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error while sending the email: ", error);
      } else {
        console.log("Email sent: ", info.response);
      }
    });
    }

    async function initCronJobs(){
      console.log("CronJobs initialized!")
      cron.schedule(process.env.CRONJOB_DEFINITION, async () => {
        await generateInvoice();
        await sendInvoiceViaEmail();
      })
    }


    const PORT = process.env.PORT || 3000;

    app.listen(PORT, async () => {
      console.log(`App started at http://localhost:${PORT}`);
      console.log("Initializing service...");

      await initCronJobs();
    });
    
}

init();