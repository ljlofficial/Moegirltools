//Based on https://github.com/MoegirlPediaInterfaceAdmins/MoegirlPediaInterfaceCodes.git
//The legacy mainpage has a lot of bugs,so I change it.
//Powered by LJL
"use strict";
$(() => {
    if (mw.config.get("wgPageName") === "Mainpage") {
        location.hash = "/topics"; 
    }
});