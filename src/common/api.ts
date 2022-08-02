


export interface BackendApi {

    getRootInjectors(): any;

    findInjectorById(): any;


    findDependencies(): any;



}


export interface FrontendApi {

    injectorCreated(): any;
    injectorDisposed(): any;

    dependencyAdded(): any;
    dependencyDeleted(): any;

    dependencyUpdated(): any;
}