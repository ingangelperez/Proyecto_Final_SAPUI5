sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {typeof sap.m.MessageBox} MessageBox
     * @param {typeof sap.ui.core.routing.History} History
     */
    function (Controller, MessageBox, History) {
        "use strict";

        return Controller.extend("aapg.employeemgmt.controller.Base", {

            onInit: function () {
            },

            checkComments: function (oEvent) {

                var sComments = oEvent.getParameter("newValue");
                var sExpReg = /^([a-zA-Z0-9ÑñÁáÉéÍíÓóÚúÜü.,\s]{0,200})$/;
                var sExpRegCRLF = /[\n\r]/;
                var oConfigModel = this.getView().getModel("createEmplConfig");
                var oConfigData = oConfigModel.getData();

                if (sExpReg.exec(sComments) && !sExpRegCRLF.exec(sComments)) {
                    oConfigData.CommentaryState = true;
                } else {
                    oConfigData.CommentaryState = false;
                }

                oConfigModel.refresh();

            },

            onFileChange: function (oEvent) {
                //Agregar Token CSFR a la cabecera

                var oUplCollection = oEvent.getSource();
                var oHeaderToken = new sap.m.UploadCollectionParameter({
                    name: "x-csrf-token",
                    value: this.getView().getModel("employeesModel").getSecurityToken()
                });

                oUplCollection.addHeaderParameter(oHeaderToken);

            },

            onFileBeforeUpload: function (oEvent, sEmployeeId) {
                //Agregar parámetro slug a la cabecera de la petición

                var sFilename = oEvent.getParameter("fileName");
                var oHeaderSlug = new sap.m.UploadCollectionParameter({
                    name: "slug",
                    value: this.getOwnerComponent().SapId + ";" + sEmployeeId + ";" + sFilename
                });

                oEvent.getParameters().addHeaderParameter(oHeaderSlug);

                //Incrementar el contador de archivos
                this._filesQty++;

            },

            onFilenameLengthExceed: function (oEvent) {
                var oi18n = this.getView().getModel("i18n").getResourceBundle();
                MessageBox.error(oi18n.getText("fileLengthExceeded"), {
                    title: oi18n.getText("fileUploadTitle")
                });
            },

            onFileSizeExceed: function (oEvent) {
                var oi18n = this.getView().getModel("i18n").getResourceBundle();
                MessageBox.error(oi18n.getText("fileSizeExceeded"), {
                    title: oi18n.getText("fileUploadTitle")
                });
            },

            _navBack: function (oEvent) {

                var oHistory = History.getInstance();
                var sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                }
                else {
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    oRouter.navTo("RouteLaunchpad", true);
                }

            }

        });
    });
