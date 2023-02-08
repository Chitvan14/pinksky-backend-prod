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
    html = `<!DOCTYPE html><html>
   
    
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
