sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {typeof sap.m.MessageToast} MessageToast
     */
    function (Controller, MessageToast) {
        "use strict";

        return Controller.extend("aapg.employeemgmt.controller.Launchpad", {
            onInit: function () {
                
            },

            onTileClick: function(oEvent){
                //Gestionar navegación desde tiles

                var oi18n = this.getView().getModel("i18n").getResourceBundle();
                var sAction = oEvent.getSource().data("customAction");
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

                switch (sAction) {
                    case "createEmployee":
                        //Navegar a la creación de empleados
                        oRouter.navTo("RouteCreateEmployee");
                        break;

                    case "viewEmployee":
                        //Navegar a la visualización de empleados
                        oRouter.navTo("RouteViewEmployee");
                        //MessageToast.show(oi18n.getText("onConstruction"));
                        break;
                    
                    case "signOrders":
                        //Redireccionar a URL de App de firma de pedidos
                        sap.m.URLHelper.redirect(oEvent.getSource().getUrl(), true);
                        break;
                
                    default:
                        //Notificar que debe seleccionar una opción válida
                        MessageToast.show(oi18n.getText("invalidNavigation"));
                        break;
                }

            }

        });
    });
