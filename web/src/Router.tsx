import { Route, Routes } from "react-router";
import { BrowserRouter } from "react-router";
import AppLayout from "./components/layout/AppLayout";
import { ComponentExample } from "./components/component-example";




export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" Component={AppLayout}>
                    <Route index element={<ComponentExample />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}