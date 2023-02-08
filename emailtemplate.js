module.exports = function (type, data) {
  let html = "";

  if (
    type === "signincompleteprofile" ||
    type === "registerdetailmail" ||
    type === "couponredeembyuser" ||
    type === "registerlaunchingsoon" ||
    type === "influencernewrequestaccepted" ||
    type === "influencercampaignaccepted" ||
    type === "brandnewrequestaccepted" ||
    type === "influencereventaccepted" ||
    type === "verifyemail"
  ) {
    // html = `<span> ${data.text} </span> <a href=${data.href} style="text-decoration:none; color:#151515;"> Go to website →</a>`;
    html = `<html>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap');
    </style>
    
    <body style="background-color:#fff;margin:0">
        <table style="width:100%;border-collapse:collapse">
            <tr>
               
                <td style="padding:0;width:600px;background-color:#fff" width="600">
                    <table style="width:100%;max-width:600px;background-color:#fff;border-collapse:collapse">
                        <tr>
                            <td style="padding:0">
                                <table style="width:100%;max-width:600px;border-collapse:collapse">
                                    <tr>
                                        <td style="padding:0">
                                            <div style="background-image:url(https://firebasestorage.googleapis.com/v0/b/pinksky-website.appspot.com/o/Brands%2Fpinksky.png?alt=media&token=f1c44d80-06bb-414a-b08f-e9df94b90388);background-repeat:no-repeat;background-position:bottom;height:150px;background-size: 100px 100px;margin-bottom:30px;padding-top:32px;padding-left:32px">
                                            </div>
                                        </td>
                                    </tr>
                                </table>
    
                                <table style="width:100%;max-width:600px;border-collapse:collapse;background-color:#fff">
                                    <tr>
                                        <td style="padding:0">
                                            <table style="width:89.333333%;max-width:536px;margin:auto;border-collapse:collapse">
                                                <tr>
                                                    <td style="padding:0">
                                                        <div style="display:flex;text-align:center;flex-direction:column;max-width:358px;padding-top:12px;vertical-align:top;margin:auto">
                                                            <p style="font-family:Lato;text-align:left;font-weight:400;font-style:normal;font-size:13px;line-height:24px;margin:auto;color:#151515">${data.text}</p>
                                                        </div>
                                                        <a href=${data.href} target="_blank" style="font-family:Lato;font-weight:400;font-size:13px;line-height:20px;text-align:center;letter-spacing:.25px;color:#151515;padding:6px 16px;background:#f7f7f7;border-radius:6px;margin:auto;margin-top:14px;display:block;width:200px;text-decoration:none">${data.hrefText}</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                <table style="width:100%;max-width:600px;border-collapse:collapse;background-color:#fff">
                                    <tr>
                                        <td style="padding:0">
                                            <table style="width:86.666667%;max-width:520px;margin:auto;border-collapse:collapse">
                                                <tr>
                                                    <td style="padding:0">
                                                        <div style="display:flex;justify-content:center;padding-top:32px;padding-bottom:26px">
    
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                <table style="width:100%;max-width:600px;border-collapse:collapse;background-color:#151515">
                                    <tr>
                                        <td style="padding:0">
                                            <table style="width:68%;max-width:4166px;margin:auto;border-collapse:collapse">
                                                <tr>
                                                    <td style="padding:24px 0">
                                                        <p style="margin:auto;margin-bottom:4px;font-weight:400;font-size:13px;line-height:28.8px;text-align:center;color:#151515;font-family:Lato">If you have any questions, please reach out to us at</p>
                                                        <a href="mailto:pinkskyclubdev@gmail.com" target="_blank" style="font-family:Lato;font-weight:400;font-size:13px;line-height:20px;text-align:center;letter-spacing:.25px;color:#151515;padding:6px 16px;background:#f7f7f7;border-radius:6px;margin:auto;margin-bottom:14px;display:block;width:250px;text-decoration:none">club.pinksky@gmail.com</a>
                                                        <a href="https://www.instagram.com/pinksky.club/" target="_blank" style="font-family:Lato;font-weight:400;font-size:13px;line-height:20px;text-align:center;letter-spacing:.25px;color:#151515;padding:6px 16px;background:#f7f7f7;border-radius:6px;margin:auto;margin-bottom:14px;display:block;width:250px;text-decoration:none">Instagram - pinksky.club</a>
                                                        <a href="https://www.instagram.com/pinksky.events/" target="_blank" style="font-family:Lato;font-weight:400;font-size:13px;line-height:20px;text-align:center;letter-spacing:.25px;color:#151515;padding:6px 16px;background:#f7f7f7;border-radius:6px;margin:auto;margin-bottom:14px;display:block;width:250px;text-decoration:none">Instagram - pinksky.events</a>
                                                        <div style="filter: invert(100%);margin:0 32px 24px;text-align:center"><img src="https://firebasestorage.googleapis.com/v0/b/pinksky-8804c.appspot.com/o/brand-logo%2Fwis-line.png?alt=media&token=2c641a8a-f4f4-4616-abde-00a53de700a3"></div>
    
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
                <td style="font-size:0"></td>
            </tr>
        </table>
    </body>
    
    </html>`;
  }
  //registerdetailmail
  //w//couponredeembyuser
  //w//registerlaunchingsoon
  //influencernewrequestaccepted
  //w//influencercampaignaccepted
  //brandnewrequestaccepted
  return html;
};
