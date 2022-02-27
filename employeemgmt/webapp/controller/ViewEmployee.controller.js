sap.ui.define([
    "aapg/employeemgmt/controller/Base.controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof aapg.employeemgmt.controller.Base} Base
     * @param {typeof sap.m.MessageToast} MessageToast
     * @param {typeof sap.m.MessageBox} MessageBox
     * @param {typeof sap.ui.model.Filter} Filter
     * @param {typeof sap.ui.model.FilterOperator} FilterOperator
     */
    function (Base, MessageToast, MessageBox, Filter, FilterOperator) {
        "use strict";

        return Base.extend("aapg.employeemgmt.controller.ViewEmployee", {
            onInit: function () {

                this._splitApp = this.byId("viewEmployeeSplitApp");
                this.getView().setBusyIndicatorDelay(200);
                this.getOwnerComponent().getRouter().getRoute("RouteViewEmployee").attachPatternMatched(this._onRouteMatched, this);

                this.getView().byId("employeeMasterPage").setBusyIndicatorDelay(100);
                this.getView().byId("employeeDetailPage").setBusyIndicatorDelay(100);

                //Contador de archivos (para el upload)
                this._filesQty;

            },
            _onRouteMatched: function (oEvent) {

                //Temporal
                this.getView().getModel("employeesModel").setUseBatch(false);

                if (this._splitApp.getCurrentDetailPage() !== this.getView().byId("detailLandingPage")) {
                    this._splitApp.backToTopDetail();
                }

            },

            onFilterMaster: function (oEvent) {

                var aFilters = [];
                var sFilterValue = oEvent.getParameter("query");

                if (sFilterValue !== "") {
                    aFilters.push(new Filter({
                        filters: [
                            new Filter("FirstName", FilterOperator.Contains, sFilterValue),
                            new Filter("LastName", FilterOperator.Contains, sFilterValue),
                            new Filter("Dni", FilterOperator.Contains, sFilterValue)
                        ],
                        and: false
                    }));
                }

                var oBinding = this.getView().byId("employeeList").getBinding("items");
                oBinding.filter(aFilters);

            },

            onNavToDetail: function (oEvent) {

                var oContext = oEvent.getSource().getBindingContext("employeesModel");
                var oObject = oContext.getObject();

                this.getView().byId("employeeDetailPage").bindElement({
                    path: oContext.getPath(),
                    model: "employeesModel"
                });

                //Inicializar contador de archivos
                this._filesQty = 0;

                this._splitApp.toDetail(this.createId("employeeDetailPage"));

                //Si el dispositivo es una tablet y se encuentra en modo portrait, se
                //oculta el master, ya que por defecto no lo está haciendo
                var oDeviceModelData = this.getView().getModel("device").getData();
                if (oDeviceModelData.system.tablet && oDeviceModelData.orientation.portrait) {
                    this._splitApp.hideMaster();
                }

            },

            onBackToMaster: function () {
                this._splitApp.toMaster(this.createId("employeeMasterPage"));
            },

            onAscend: function (oEvent) {
                //Cargar diálogo para ascender empleado

                if (!this._oDialogAscend) {
                    this._oDialogAscend = sap.ui.xmlfragment("aapg.employeemgmt.fragment.DialogAscend", this);
                    this.getView().addDependent(this._oDialogAscend);
                }

                //Se asigna un número para eliminar posibles errores por entradas incorrectas
                //que no hayan sido asignadas al modelo
                sap.ui.getCore().byId("newSalary").setValue("1");

                var oConfigModel = this.getView().getModel("createEmplConfig");
                var oConfigData = oConfigModel.getData();

                //Inicializar propiedades del modelo para 
                //controlar campos del diálogo
                oConfigModel.refresh();
                oConfigData.NewSalary = null;
                oConfigData.CreationDate = null;
                oConfigData.Commentary = "";
                oConfigData.CreationDateState = true;
                oConfigData.CreationDateFilled = false;
                oConfigData.NewSalaryState = true;
                oConfigData.NewSalaryFilled = false;
                oConfigData.CommentaryState = true;
                oConfigModel.refresh();
                                
                this._oDialogAscend.open();
                

            },

            onSaveAscend: function (oEvent) {
                //Generar ascenso

                var oi18n = this.getView().getModel("i18n").getResourceBundle();
                var oConfigData = this.getView().getModel("createEmplConfig").getData();

                //Comprobar si los datos están ok para guardar el ascenso
                if (oConfigData.NewSalaryFilled && (sap.ui.getCore().byId("newSalary").getValueState() === "Error")) {
                    //El salario posee un valor incorrecto
                    MessageToast.show(oi18n.getText("errorNewSalary"));
                    return;

                } else if (!oConfigData.NewSalaryFilled) {
                    //Debe indicar el salario
                    MessageToast.show(oi18n.getText("newSalaryEmpty"));
                    return;
                }

                if (!oConfigData.CreationDateState || !oConfigData.CreationDateFilled) {
                    //Debe indicar la fecha del ascenso
                    MessageToast.show(oi18n.getText("errorNewSalaryDate"));
                    return;
                }

                if (!oConfigData.CommentaryState) {
                    //El comentario es inválido
                    MessageToast.show(oi18n.getText("errorMsgInvalidComments"));
                    return;
                }

                MessageBox.confirm(oi18n.getText("confirmNewAscend"), {
                    title: oi18n.getText("newAscend"),
                    onClose: this._saveAscend.bind(this)
                });

            },

            onCancelAscend: function () {
                //Cerrar diálogo de ascenso
                if (this._oDialogAscend) {
                    this._oDialogAscend.close();
                }
            },

            onNewSalaryChange: function (oEvent) {
                //Validar si el salario se encuentra lleno
                //Acá no se valida si es correcto el valor, de eso se encarga el formato

                var oConfigModel = this.getView().getModel("createEmplConfig");
                var oConfigData = oConfigModel.getData();

                if (oEvent.getSource().getValue() !== "") {
                    oConfigData.NewSalaryFilled = true;
                } else {
                    oConfigData.NewSalaryFilled = false;
                }

                oConfigModel.refresh();

            },

            onNewSalaryDateChange: function (oEvent) {
                //Validar la fecha del nuevo salario

                var oConfigModel = this.getView().getModel("createEmplConfig");
                var oConfigData = oConfigModel.getData();

                if (oEvent.getSource().getValue() !== "" && oEvent.getSource().isValidValue()) {
                    oConfigData.CreationDateState = true;
                    oConfigData.CreationDateFilled = true;
                } else {
                    oConfigData.CreationDateState = false;
                    oConfigData.CreationDateFilled = false;
                }

                oConfigModel.refresh();

            },

            _saveAscend: function (sAction) {

                //Validar si el usuario confirmó guardar el ascenso
                if (sAction === "OK") {
                    if (this._oDialogAscend) {
                        this._oDialogAscend.close();
                    }
                } else {
                    return;
                }

                var oi18n = this.getView().getModel("i18n").getResourceBundle();
                var oEmployeesModel = this.getView().getModel("employeesModel");

                var oBody = {
                    SapId: this.getOwnerComponent().SapId,
                    EmployeeId: this.byId("employeeDetailPage").getBindingContext("employeesModel").getObject().EmployeeId,
                    CreationDate: this.getView().getModel("createEmplConfig").getData().CreationDate,
                    Amount: this.getView().getModel("createEmplConfig").getData().NewSalary.toString(),
                    Waers: this.getView().getModel("createEmplConfig").getData().DefaultCurrency,
                    Comments: this.getView().getModel("createEmplConfig").getData().Commentary
                };

                this.getView().setBusy(true);
                oEmployeesModel.create("/Salaries", oBody, {
                    success: function () {
                        this.getView().setBusy(false);
                        MessageToast.show(oi18n.getText("newAscendSaved"));
                    }.bind(this),
                    error: function () {
                        this.getView().setBusy(false);
                        MessageBox.error(oi18n.getText("newAscendNotSaved"), {
                            title: oi18n.getText("newAscend")
                        });
                    }.bind(this)
                });

            },

            onDeleteEmployee: function (oEvent) {
                //Dar de baja al empleado
                var oi18n = this.getView().getModel("i18n").getResourceBundle();
                MessageBox.confirm(oi18n.getText("confirmDeleteEmployee"), {
                    title: oi18n.getText("deleteEmployeeTitle"),
                    onClose: this._deleteEmployee.bind(this)
                });

            },

            _deleteEmployee: function (sAction) {

                //Validar si el usuario confirmó dar de baja al empleado
                if (sAction !== "OK") {
                    return;
                }

                var oi18n = this.getView().getModel("i18n").getResourceBundle();
                var oEmployeesModel = this.getView().getModel("employeesModel");

                //Obtener el path del empleado que se va a borrar (entidad Users)
                var sPath = this.byId("employeeDetailPage").getBindingContext("employeesModel").getPath();

                this._setBusyForFiles(true);
                oEmployeesModel.remove(sPath, {
                    success: function () {

                        //Se borran los salarios y los adjuntos porque el OData no está borrando
                        //las dependencias (temporal mientras ajustan el OData)
                        var oTimeline = this.byId("timeline");
                        var oTimeLineItems = oTimeline.getAggregation("content");
                        var oUplCollection = this.byId("viewEmplUploadFile");
                        var oUplItems = oUplCollection.getAggregation("items");

                        for (var item in oTimeLineItems) {
                            var sPath = oTimeLineItems[item].getBindingContext("employeesModel").getPath();
                            if (sPath.includes("Salaries")) {
                                this._deleteEmployeeDependencies(sPath);
                            }
                        }

                        for (var item in oUplItems) {
                            var sPath = oUplItems[item].getBindingContext("employeesModel").getPath();
                            if (sPath.includes("Attachments")) {
                                this._deleteEmployeeDependencies(sPath);
                            }
                        }

                        jQuery.sap.delayedCall(1000, this, function () {
                            //Desbloquear vistas - con delay para una mejor experiencia de usuario
                            this._setBusyForFiles(false);
                            this._splitApp.backToTopDetail();
                            MessageToast.show(oi18n.getText("employeeDeleted"));
                        }.bind(this));

                    }.bind(this),
                    error: function () {
                        this.getView().setBusy(false);
                        jQuery.sap.delayedCall(1500, this, function () {
                            //Desbloquear vistas - con delay para una mejor experiencia de usuario
                            this._setBusyForFiles(false);
                            MessageBox.error(oi18n.getText("employeeNotDeleted"), {
                                title: oi18n.getText("deleteEmployeeTitle")
                            });
                        }.bind(this));
                    }.bind(this)
                });

            },

            _deleteEmployeeDependencies: function (sPath) {
                //Borrar salarios y archivos del empleado, ya que el OData no lo está borrando
                //Es una rutina temporal, mientras ajustan el OData
                var oEmployeesModel = this.getView().getModel("employeesModel");

                oEmployeesModel.remove(sPath, {
                    success: function () {
                        console.log("Dependency deleted");
                    }.bind(this),
                    error: function () {
                        console.log("Error deleting dependency");
                    }.bind(this)
                });

            },

            onFileBeforeUpload: function (oEvent) {
                //Agregar parámetro slug a la cabecera de la petición

                //Bloquear vistas para evitar que el usuario ejecute accioenes
                this._setBusyForFiles(true);

                //Se obtiene el ID del emlpeado y se llama a la función padre en el controlador Base
                var oObjContext = this.byId("employeeDetailPage").getBindingContext("employeesModel").getObject();
                Base.prototype.onFileBeforeUpload.apply(this, [oEvent, oObjContext.EmployeeId]);

            },

            onFileUploadComplete: function (oEvent) {

                this._filesQty--;//Control de cantidad de archivos pendientes por cargar

                var oi18n = this.getView().getModel("i18n").getResourceBundle();
                oEvent.getSource().getBinding("items").refresh();

                //Evaluar si se cargó el archivo en el servidor
                if (this._filesQty === 0) {

                    //Desbloquear vistas
                    this._setBusyForFiles(false);

                    if (oEvent.getParameters().files.length > 0) {
                        if (oEvent.getParameters().files[0].status >= 200 && oEvent.getParameters().files[0].status <= 299) {
                            MessageToast.show(oi18n.getText("fileUploadOK"));
                        } else {
                            MessageBox.error(oi18n.getText("fileUploadKO"), {
                                title: oi18n.getText("fileUploadTitle")
                            });
                        }
                    }
                }
            },

            onFileDelete: function (oEvent) {
                //Borrar archivo del backend
                var oi18n = this.getView().getModel("i18n").getResourceBundle();
                var oUplCollection = oEvent.getSource();
                var sPath = oEvent.getParameter("item").getBindingContext("employeesModel").getPath();
                var oModel = this.getView().getModel("employeesModel");

                //Bloquear vistas para evitar que el usuario ejecute accioenes
                this._setBusyForFiles(true);

                oModel.remove(sPath, {
                    success: function () {
                        //Se añade delay para que no se vea brusco el apagado del busy indicator
                        //cuando el proceso de borrado es muy rápido
                        oUplCollection.getBinding("items").refresh();
                        jQuery.sap.delayedCall(1500, this, function () {
                            //Desbloquear vistas
                            this._setBusyForFiles(false);
                            MessageToast.show(oi18n.getText("fileDeleted"))
                        }.bind(this));
                    }.bind(this),
                    error: function () {
                        //Se añade delay para que no se vea brusco el apagado del busy indicator
                        //cuando el proceso de borrado es muy rápido
                        jQuery.sap.delayedCall(500, this, function () {
                            //Desbloquear vistas
                            this._setBusyForFiles(false);
                            MessageBox.error(oi18n.getText("fileNotDeleted"), {
                                title: oi18n.getText("deleteFileTitle")
                            });
                        }.bind(this));
                    }.bind(this)
                });

            },

            onDownloadFile: function (oEvent) {
                var sPath = oEvent.getSource().getBindingContext("employeesModel").getPath();
                window.open("/sap/opu/odata/sap/ZEMPLOYEES_SRV" + sPath + "/$value");
            },

            onNavBack: function (oEvent) {
                this._navBack();
            },

            _setBusyForFiles: function (bOption) {
                this.byId("employeeMasterPage").setBusy(bOption);
                this.byId("employeeDetailPage").setBusy(bOption);
            }

        });
    });
