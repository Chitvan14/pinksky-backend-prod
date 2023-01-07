module.exports = function (type, data) {
  let html = "";

  if (
    type === "signincompleteprofile" ||
    type === "registerdetailmail" ||
    type === "couponredeembyuser" ||
    type === "registerlaunchingsoon" ||
    type === "influencernewrequestaccepted" ||
    type === "influencercampaignaccepted" ||
    type === "brandnewrequestaccepted"
  ) {
    html = `<span> ${data.text} </span> <a href=${data.href} style="text-decoration:none; color:#151515;"> Go to website →</a>`;
    //     html = `<table
    // width="100%"
    // style="border: 0; text-align: center"
    // cellpadding="0"
    // cellspacing="0"
    // >
    // <tbody>
    //   <tr>
    //     <td style="text-align: center">
    //       <table
    //         class="col-600"
    //         width="600"
    //         style="border: 0; text-align: center"
    //         cellpadding="0"
    //         cellspacing="0"
    //       >
    //         <tbody>
    //           <tr>
    //             <td
    //               style="border: 0; text-align: center; background-color: #fecbeb"
    //               valign="top"
    //             >
    //               <table
    //                 class="col-600"
    //                 width="600"
    //                 height="0"
    //                 style="border: 0; text-align: center"
    //                 cellpadding="0"
    //                 cellspacing="0"
    //               >
    //                 <tbody>
    //                   <tr>
    //                     <td height="10"></td>
    //                   </tr>

    //                   <tr>
    //                     <td style="text-align: center" style="line-height: 0px">
    //                       <img
    //                         style="
    //                           margin: auto;
    //                           display: block;
    //                           line-height: 0px;
    //                           font-size: 0px;
    //                           border: 0px;
    //                         "
    //                         src="https://firebasestorage.googleapis.com/v0/b/pinksky-8804c.appspot.com/o/brand-logo%2FpinkskyTextLogo.png?alt=media&token=f930524d-66c9-464b-bd8e-a236d78860fe"
    //                         width="100"
    //                         height="40"
    //                         alt="logo"
    //                       />
    //                     </td>
    //                   </tr>

    //                   <tr>
    //                     <td height="10"></td>
    //                   </tr>
    //                 </tbody>
    //               </table>
    //             </td>
    //           </tr>
    //         </tbody>
    //       </table>
    //     </td>
    //   </tr>

    //   <tr>
    //     <td style="text-align: center">
    //       <table
    //         class="col-600"
    //         width="600"
    //         style="border: 0"
    //         style="text-align: center"
    //         cellpadding="0"
    //         cellspacing="0"
    //         style="margin-left: 20px; margin-right: 20px"
    //       >
    //         <tbody>
    //           <tr>
    //             <td height="35"></td>
    //           </tr>

    //           <tr>
    //             <td height="10"></td>
    //           </tr>

    //           <tr>
    //             <td
    //               style="
    //                 font-size: 14px;
    //                 text-align: left;
    //                 font-weight: 400;
    //                 padding-left: 40px;
    //                 color: #868686;
    //                 line-height: 24px;
    //                 font-weight: 300;
    //               "
    //             >
    //              ${data.text} <br /><br /><a
    //                 href="https://pinksky-development.netlify.app/"
    //                 target="_blank"
    //                 style="
    //                   text-decoration: none;
    //                   color: #151515;
    //                   font-weight: 500;
    //                 "
    //                 >Go to website →
    //               </a>
    //             </td>
    //           </tr>
    //         </tbody>
    //       </table>
    //     </td>
    //   </tr>

    //   <tr>
    //     <td style="text-align: center">
    //       <table
    //         class="col-600"
    //         width="600"
    //         style="border: 0"
    //         style="text-align: center"
    //         cellpadding="0"
    //         cellspacing="0"
    //         style="margin-left: 20px; margin-right: 20px"
    //       >
    //         <tbody>
    //           <tr>
    //             <td style="text-align: center">
    //               <table
    //                 style="text-align: center"
    //                 width="100%"
    //                 style="border: 0"
    //                 cellspacing="0"
    //                 cellpadding="0"
    //               >
    //                 <tbody>
    //                   <tr>
    //                     <td height="100"></td>
    //                   </tr>
    //                   <tr>
    //                     <td
    //                       style="text-align: center; background-color: #f7f7f7"
    //                       height="100"
    //                     >
    //                       <table
    //                         class="col-600"
    //                         width="600"
    //                         style="border: 0"
    //                         style="text-align: center"
    //                         cellpadding="0"
    //                         cellspacing="0"
    //                       >
    //                         <tbody>
    //                           <tr>
    //                             <td height="25"></td>
    //                           </tr>

    //                           <tr>
    //                             <td
    //                               style="text-align: center"
    //                               style="
    //                                 font-size: 16px;
    //                                 font-weight: 500;
    //                                 color: #151515;
    //                               "
    //                             >
    //                               Follow us for some cool stuffs
    //                             </td>
    //                           </tr>

    //                           <tr>
    //                             <td height="25"></td>
    //                           </tr>
    //                         </tbody>
    //                       </table>
    //                       <table
    //                         style="text-align: center; margin: auto"
    //                         width="35%"
    //                         style="border: 0"
    //                         cellspacing="0"
    //                         cellpadding="0"
    //                       >
    //                         <tbody>
    //                           <tr>
    //                             <td
    //                               style="text-align: center"
    //                               class="margin"
    //                               width="30%"
    //                               style="vertical-align: top"
    //                             >
    //                               <a
    //                                 href="https://www.instagram.com/pinksky.club/"
    //                                 target="_blank"
    //                               >
    //                                 <img
    //                                   height="80"
    //                                   width="80"
    //                                   src="https://firebasestorage.googleapis.com/v0/b/pinksky-8804c.appspot.com/o/brand-logo%2Fpinkskyclub.png?alt=media&token=bb3c8a3d-f7b9-4482-958d-7bf1e5e8d75c"
    //                                 />
    //                               </a>
    //                             </td>

    //                             <td
    //                               style="text-align: center"
    //                               width="30%"
    //                               style="
    //                                 vertical-align: top;
    //                                 background-color: #fff;
    //                               "
    //                             >
    //                               <a
    //                                 href="https://www.instagram.com/pinksky.events/"
    //                                 target="_blank"
    //                               >
    //                                 <img
    //                                   height="78"
    //                                   width="78"
    //                                   src="https://firebasestorage.googleapis.com/v0/b/pinksky-8804c.appspot.com/o/brand-logo%2Fpinkskyevent.png?alt=media&token=5f22d650-8054-4124-8425-743e43ee37bd"
    //                                 />
    //                               </a>
    //                             </td>
    //                           </tr>
    //                           <tr>
    //                             <td height="25"></td>
    //                           </tr>
    //                         </tbody>
    //                       </table>
    //                     </td>
    //                   </tr>
    //                 </tbody>
    //               </table>
    //             </td>
    //           </tr>
    //         </tbody>
    //       </table>
    //     </td>
    //   </tr>
    // </tbody>
    // </table>
    // `;
  }
  //registerdetailmail
  //w//couponredeembyuser
  //w//registerlaunchingsoon
  //influencernewrequestaccepted
  //w//influencercampaignaccepted
  //brandnewrequestaccepted
  return html;
};
