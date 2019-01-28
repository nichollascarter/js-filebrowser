export const HTTP_PREFIX = ''; //http://localhost:4000/ use in development mode

export function defineProperty(
    obj, 
    prop, 
    value, 
    writable, 
    configurable
) {
    Object.defineProperty(obj, prop, {
        value: value,
        writable: writable,
        configurable: configurable
    })
}