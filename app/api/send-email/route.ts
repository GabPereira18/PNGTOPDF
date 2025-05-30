
// src/app/api/send-email/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body, pdfData, pdfFileName } = await request.json();

    if (!to || !subject || !body || !pdfData || !pdfFileName) {
      return NextResponse.json({ error: 'Dados incompletos para envio de e-mail.' }, { status: 400 });
    }

    // Validação básica do e-mail do destinatário
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return NextResponse.json({ error: 'Endereço de e-mail do destinatário inválido.' }, { status: 400 });
    }

    // Configuração do transportador Nodemailer
    // IMPORTANTE: Use variáveis de ambiente para suas credenciais!
    // Veja o arquivo .env.example
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT || 587), // Porta padrão para SMTP com STARTTLS
      secure: process.env.EMAIL_SERVER_SECURE === 'true', // true para porta 465, false para outras portas
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
      // Adicione isso se estiver usando um certificado autoassinado em desenvolvimento
      // tls: {
      //   rejectUnauthorized: process.env.NODE_ENV === 'production', 
      // },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER, // E-mail do remetente
      to: to, // E-mail do destinatário
      subject: subject, // Assunto
      text: body, // Corpo do e-mail em texto plano
      html: `<p>${body.replace(/\n/g, '<br>')}</p>`, // Corpo do e-mail em HTML
      attachments: [
        {
          filename: pdfFileName,
          content: pdfData, // String Base64
          encoding: 'base64',
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'E-mail enviado com sucesso!' }, { status: 200 });

  } catch (error) {
    console.error('Erro no servidor ao enviar e-mail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no servidor.';
    return NextResponse.json({ error: `Falha ao enviar e-mail: ${errorMessage}` }, { status: 500 });
  }
}
