import { EmailFragment } from 'skiff-front-graphql';

export const MOCK_EMAIL: EmailFragment = {
  id: 'emailID',
  createdAt: new Date('123456'),
  decryptedSubject: 'test subject',
  decryptedText: '<p>This is a body</p><p><strong>Bold</strong></p><blockquote> <p> WOW </p> </blockquote>',
  attachmentMetadata: [
    {
      attachmentID: 'attachmentID',
      encryptedData: { encryptedData: 'DATA' }
    }
  ],
  decryptedAttachmentMetadata: [
    {
      attachmentID: 'attachmentID',
      decryptedMetadata: {
        contentType: 'word',
        contentDisposition: '10',
        size: 10012,
        checksum: '100',
        contentId: '1',
        filename: 'FILE.AA'
      }
    }
  ],
  from: {
    address: 'from@skiff.town',
    name: 'Michael Jackson'
  },
  to: [
    {
      address: 'to@skiff.town',
      name: 'John Travolta'
    }
  ],
  cc: [
    {
      address: 'cc1@skiff.town',
      name: 'Cc1'
    },
    {
      address: 'cc2@skiff.town',
      name: 'Cc2'
    },
    {
      address: 'cc3@skiff.town',
      name: 'Cc3'
    }
  ],
  bcc: [
    {
      address: 'bcc1@skiff.town',
      name: 'Bcc1'
    },
    {
      address: 'bcc2@skiff.town',
      name: 'Bcc2'
    }
  ],
  encryptedSessionKey: {
    encryptedSessionKey: '',
    encryptedBy: {
      key: ''
    }
  },
  encryptedText: {
    encryptedData: ''
  },
  encryptedSubject: {
    encryptedData: ''
  },
  encryptedHtml: {
    encryptedData: ''
  },
  encryptedTextAsHtml: {
    encryptedData: ''
  },
  notificationsTurnedOffForSender: false
};

export const MOCK_EMAIL_GMAIL_REPLY: EmailFragment = {
  ...MOCK_EMAIL,
  decryptedText: `
  <div dir=3D"ltr">This is the reply This is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the reply</div>
  <div dir=3D"ltr">This is the reply This is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the reply</div>
  <div dir=3D"ltr">This is the reply This is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the reply</div>
  <div dir=3D"ltr">This is the reply This is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the replyThis is the reply</div>
  <br><div class=3D"gmail_quote"><div=
 dir=3D"ltr" class=3D"gmail_attr">On Mon, 4 Apr 2022 at 17:34, Noam Golani =
&lt;<a href=3D"mailto:noam.golani@gmail.com">noam.golani@gmail.com</a>&gt; =
wrote:<br></div><blockquote class=3D"gmail_quote" style=3D"margin:0px 0px 0=
px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex"><div dir=
=3D"ltr">This is a mail</div>
</blockquote></div><br clear=3D"all"><div><br></div>
  `
};

export const MOCK_EMAIL_PROTON_REPLY: EmailFragment = {
  ...MOCK_EMAIL,
  decryptedText: `
<div style="font-family: arial; font-size: 14px; color: rgb(34, 34, 34);">This is the reply</div><div class="protonmail_quote">
        ------- Original Message -------<br>
        On Monday, April 4th, 2022 at 17:41, noamgolani &lt;noamgolani@protonmail.com&gt; wrote:<br><br>
        <blockquote class="protonmail_quote" type="cite">
            <div style="font-family: arial; font-size: 14px; color: rgb(34, 34, 34);">This is the mail</div>
        </blockquote><br>
    </div>
  `
};

export const MOCK_EMAIL_OUTLOOK_REPLY: EmailFragment = {
  ...MOCK_EMAIL,
  decryptedText: `
  <html>
    <head>
    <meta http-equiv=3D"Content-Type" content=3D"text/html; charset=3Dwindows-1=255">
    <style type=3D"text/css" style=3D"display:none;"> P {margin-top:0;margin-bottom:0;} </style>
    </head>
  <body dir=3D"rtl">
  <div style=3D"font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">This is the reply</div>
  <div id=3D"appendonsend"></div>
    <hr style=3D"display:inline-block;width:98%" tabindex=3D"-1">
    <div id=3D"divRplyFwdMsg" dir=3D"rtl">
      <font face=3D"Calibri, sans-serif" style=3D"font-size:11pt" color=3D"#000000">
      <b>=EE=E0=FA:</b>
      noam golani &lt;noamgolani@outlook.co.il&gt;<br>
      <b>=FE=FE=F0=F9=EC=E7:</b> =E9=E5=ED&nbsp;=F9=F0=E9 04 =E0=F4=F8=E9=EC 2022 17:44<br>
      <b>=FE=FE=E0=EC:</b> noam golani &lt;noamgolani@outlook.co.il&gt;<br>
      <b>=FE=FE=F0=E5=F9=E0:</b> Subject</font>
      <div>&nbsp;</div>
    </div>
    <style type=3D"text/css" style=3D"display:none">
      <!--
      p
  	    {margin-top:0;
  	    margin-bottom:0}
      -->
    </style>
    <div dir=3D"rtl">
      <div style=3D"font-family:Calibri,Arial,Helvetica,sans-serif; font-size:12pt; color:rgb(0,0,0)">This is the mail</div>
    </div>
</body>
</html>
  `
};

export const MOCK_EMAIL_YAHOO_REPLY: EmailFragment = {
  ...MOCK_EMAIL,
  decryptedText: `
<html><head></head><body><div class="ydpe1e9e199yahoo-style-wrap" style="font-family:Helvetica Neue, Helvetica, Arial, sans-serif;font-size:15px;"><div></div>
        <div dir="ltr" data-setdir="false">This is the reply</div><div><br></div>

        </div><div id="yahoo_quoted_9201564152" class="yahoo_quoted">
            <div style="font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:13px;color:#26282a;">

                <div>
                    On Monday, 4 April 2022, 17:59:19 GMT+3, Noam golani &lt;noamgolani@yahoo.com&gt; wrote:
                </div>
                <div><br></div>
                <div><br></div>
                <div><div id="yiv7415787000"><div><div style="font-family:Helvetica Neue, Helvetica, Arial, sans-serif;font-size:15px;" class="yiv7415787000yahoo-style-wrap"><div dir="ltr">This is the mail</div></div></div></div></div>
            </div>
        </div></body></html>
  `
};

export const MOCK_EMAIL_TUTANOTA_REPLY: EmailFragment = {
  ...MOCK_EMAIL,
  decryptedText: `
  <div>This is the reply</div><div><br></div><div>4 באפר׳ 2022, 18:01 על ידי noamgolani@tutanota.com:<br></div><blockquote class="tutanota_quote"><div>This is the mail<br></div></blockquote><div dir="auto"><br></div>
  `
};
