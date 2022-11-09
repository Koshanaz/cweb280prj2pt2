export interface RouteDefinition {
    // Path to our route
    param: string;
    // HTTP Method
    method: string; // 'get' | 'post' | 'delete' | 'options' | 'put';
    // Method name within our class responsible for route
    action: string;
}
