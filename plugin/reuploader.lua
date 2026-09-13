local ScriptEditorService = game:GetService("ScriptEditorService")
local HttpService = game:GetService("HttpService")

local toolbar = plugin:CreateToolbar("Monetization Reuploader")
local button = toolbar:CreateButton(
	"Monetization Reuploader",
	"Toggle the Monetization Reuploader window",
	"rbxassetid://117053524641924"
)
button.ClickableWhenViewportHidden = true

local widgetInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Right,
	false,
	false,
	300,
	400,
	200,
	300
)

local widget = plugin:CreateDockWidgetPluginGui("MonetizationIdReplacer", widgetInfo)
widget.Title = "Monetization Reuploader"

local mainFrame = Instance.new("Frame")
mainFrame.Size = UDim2.new(1, 0, 1, 0)
mainFrame.BackgroundColor3 = Color3.fromRGB(27, 28, 33)
mainFrame.BorderSizePixel = 0
mainFrame.Parent = widget

local mainCorner = Instance.new("UICorner")
mainCorner.CornerRadius = UDim.new(0, 6)
mainCorner.Parent = mainFrame

local mainStroke = Instance.new("UIStroke")
mainStroke.Color = Color3.fromRGB(48, 51, 60)
mainStroke.Thickness = 1
mainStroke.Parent = mainFrame

local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 8)
layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
layout.Parent = mainFrame

local padding = Instance.new("UIPadding")
padding.PaddingTop = UDim.new(0, 10)
padding.PaddingBottom = UDim.new(0, 10)
padding.PaddingLeft = UDim.new(0, 10)
padding.PaddingRight = UDim.new(0, 10)
padding.Parent = mainFrame

local outputScroll = Instance.new("ScrollingFrame")
outputScroll.Size = UDim2.new(1, 0, 1, -166)
outputScroll.BackgroundColor3 = Color3.fromRGB(18, 19, 23)
outputScroll.BorderSizePixel = 0
outputScroll.ScrollBarThickness = 5
outputScroll.ScrollBarImageColor3 = Color3.fromRGB(65, 68, 80)
outputScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
outputScroll.AutomaticCanvasSize = Enum.AutomaticSize.None
outputScroll.ScrollingDirection = Enum.ScrollingDirection.Y
outputScroll.Parent = mainFrame

local outputCorner = Instance.new("UICorner")
outputCorner.CornerRadius = UDim.new(0, 5)
outputCorner.Parent = outputScroll

local outputStroke = Instance.new("UIStroke")
outputStroke.Color = Color3.fromRGB(48, 51, 60)
outputStroke.Thickness = 1
outputStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
outputStroke.Parent = outputScroll

local outputLayout = Instance.new("UIListLayout")
outputLayout.Padding = UDim.new(0, 3)
outputLayout.HorizontalAlignment = Enum.HorizontalAlignment.Left
outputLayout.Parent = outputScroll

local outputPadding = Instance.new("UIPadding")
outputPadding.PaddingTop = UDim.new(0, 8)
outputPadding.PaddingBottom = UDim.new(0, 8)
outputPadding.PaddingLeft = UDim.new(0, 8)
outputPadding.PaddingRight = UDim.new(0, 8)
outputPadding.Parent = outputScroll

local function updateOutputCanvas()
	outputScroll.CanvasSize = UDim2.new(
		0,
		0,
		0,
		outputLayout.AbsoluteContentSize.Y + 16
	)

	task.defer(function()
		outputScroll.CanvasPosition = Vector2.new(
			0,
			math.max(0, outputLayout.AbsoluteContentSize.Y + 16 - outputScroll.AbsoluteWindowSize.Y)
		)
	end)
end

outputLayout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(updateOutputCanvas)
outputScroll:GetPropertyChangedSignal("AbsoluteWindowSize"):Connect(updateOutputCanvas)

local function clearOutput()
	for _, child in ipairs(outputScroll:GetChildren()) do
		if child:IsA("TextLabel") then
			child:Destroy()
		end
	end

	updateOutputCanvas()
end

local function logMessage(messageType, message)
	local timestamp = os.date("%H:%M:%S")

	local prefix
	local textColor

	if messageType == "success" then
		prefix = "[+]"
		textColor = Color3.fromRGB(70, 210, 120)
	elseif messageType == "error" then
		prefix = "[!]"
		textColor = Color3.fromRGB(240, 70, 70)
	else
		prefix = "[-]"
		textColor = Color3.fromRGB(205, 210, 220)
	end

	local logLabel = Instance.new("TextLabel")
	logLabel.Size = UDim2.new(1, 0, 0, 18)
	logLabel.BackgroundTransparency = 1
	logLabel.Text = string.format("[%s] %s %s", timestamp, prefix, message)
	logLabel.TextColor3 = textColor
	logLabel.Font = Enum.Font.Code
	logLabel.TextSize = 12
	logLabel.TextXAlignment = Enum.TextXAlignment.Left
	logLabel.TextWrapped = false
	logLabel.Parent = outputScroll

	updateOutputCanvas()
end

local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(1, 0, 0, 24)
statusLabel.BackgroundTransparency = 1
statusLabel.Text = "[-] Status: Disconnected"
statusLabel.TextColor3 = Color3.fromRGB(205, 210, 220)
statusLabel.Font = Enum.Font.Arial
statusLabel.TextSize = 14
statusLabel.TextXAlignment = Enum.TextXAlignment.Left
statusLabel.Parent = mainFrame

local countLabel = Instance.new("TextLabel")
countLabel.Size = UDim2.new(1, 0, 0, 18)
countLabel.BackgroundTransparency = 1
countLabel.Text = "Mappings available: 0"
countLabel.TextColor3 = Color3.fromRGB(150, 155, 168)
countLabel.Font = Enum.Font.Gotham
countLabel.TextSize = 12
countLabel.TextXAlignment = Enum.TextXAlignment.Left
countLabel.Parent = mainFrame

local connectBtn = Instance.new("TextButton")
connectBtn.Size = UDim2.new(1, 0, 0, 32)
connectBtn.BackgroundColor3 = Color3.fromRGB(44, 47, 56)
connectBtn.BorderSizePixel = 0
connectBtn.Text = "Connect/Update"
connectBtn.TextColor3 = Color3.fromRGB(205, 210, 220)
connectBtn.Font = Enum.Font.GothamMedium
connectBtn.TextSize = 13
connectBtn.AutoButtonColor = true
connectBtn.Parent = mainFrame

local connectCorner = Instance.new("UICorner")
connectCorner.CornerRadius = UDim.new(0, 4)
connectCorner.Parent = connectBtn

local connectStroke = Instance.new("UIStroke")
connectStroke.Color = Color3.fromRGB(60, 64, 75)
connectStroke.Thickness = 1
connectStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
connectStroke.Parent = connectBtn

local replaceBtn = Instance.new("TextButton")
replaceBtn.Size = UDim2.new(1, 0, 0, 32)
replaceBtn.BackgroundColor3 = Color3.fromRGB(44, 47, 56)
replaceBtn.BorderSizePixel = 0
replaceBtn.Text = "Reupload"
replaceBtn.TextColor3 = Color3.fromRGB(205, 210, 220)
replaceBtn.Font = Enum.Font.GothamMedium
replaceBtn.TextSize = 13
replaceBtn.AutoButtonColor = true
replaceBtn.Parent = mainFrame

local replaceCorner = Instance.new("UICorner")
replaceCorner.CornerRadius = UDim.new(0, 4)
replaceCorner.Parent = replaceBtn

local replaceStroke = Instance.new("UIStroke")
replaceStroke.Color = Color3.fromRGB(60, 64, 75)
replaceStroke.Thickness = 1
replaceStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
replaceStroke.Parent = replaceBtn

local currentMappings = {}

button.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)

local function handleConnect()
	clearOutput()

	statusLabel.Text = "[?] Connecting..."
	statusLabel.TextColor3 = Color3.fromRGB(255, 170, 0)

	logMessage("info", "Connecting to the local Node server...")

	local success, response = pcall(function()
		return HttpService:GetAsync("http://127.0.0.1:8082/mappings")
	end)

	if not success then
		statusLabel.Text = "[-] Status: Offline"
		statusLabel.TextColor3 = Color3.fromRGB(240, 70, 70)

		countLabel.Text = "Mappings available: 0"
		currentMappings = {}

		logMessage("error", "Failed to connect to the local Node server")
		logMessage("info", "Make sure the CLI is running")
		return
	end

	logMessage("success", "Connected to local Node server")

	local decodeSuccess, data = pcall(function()
		return HttpService:JSONDecode(response)
	end)

	if not decodeSuccess or not data or not data.mappings then
		statusLabel.Text = "[!] Status: Server Error"
		statusLabel.TextColor3 = Color3.fromRGB(240, 70, 70)

		countLabel.Text = "Mappings available: 0"
		currentMappings = {}

		logMessage("error", "Invalid mappings payload received from local Node server")
		return
	end

	currentMappings = data.mappings

	statusLabel.Text = "[+] Status: Connected"
	statusLabel.TextColor3 = Color3.fromRGB(70, 210, 120)

	countLabel.Text = "Mappings available: " .. #currentMappings

	logMessage("success", "Mappings loaded: " .. #currentMappings)

	if #currentMappings == 0 then
		logMessage("info", "No mappings are currently available")
	end
end

connectBtn.MouseButton1Click:Connect(handleConnect)

local function handleReplace()
	if #currentMappings == 0 then
		logMessage("error", "No mappings available")
		logMessage("info", "Click Connect/Update to update the latest mappings")
		return
	end

	logMessage("info", "Starting monetization ID replacement...")

	local startTime = os.clock()
	local scriptsModified = 0
	local referencesReplaced = 0
	local scriptsSkipped = 0

	local targetServices = {
		game:GetService("Workspace"),
		game:GetService("ReplicatedStorage"),
		game:GetService("ServerScriptService"),
		game:GetService("ServerStorage"),
		game:GetService("StarterGui"),
		game:GetService("StarterPack"),
		game:GetService("StarterPlayer"),
		game:GetService("ReplicatedFirst")
	}

	local scripts = {}

	for _, service in ipairs(targetServices) do
		local success, descendants = pcall(function()
			return service:GetDescendants()
		end)

		if success and descendants then
			for i, obj in ipairs(descendants) do
				if obj:IsA("Script") or obj:IsA("LocalScript") or obj:IsA("ModuleScript") then
					table.insert(scripts, obj)
				end

				if i % 400 == 0 then
					task.wait()
				end
			end
		else
			logMessage("error", "Failed to scan service: " .. service.Name)
		end
	end

	logMessage("info", "Found " .. #scripts .. " scripts to scan")

	for _, scriptObj in ipairs(scripts) do
		local sourceSuccess, source = pcall(function()
			return ScriptEditorService:GetEditorSource(scriptObj)
		end)

		if not sourceSuccess or not source then
			scriptsSkipped += 1
			logMessage("error", "Failed to retrieve source: " .. scriptObj:GetFullName())
			continue
		end

		local newSource = source
		local matchesFound = 0

		for _, mapping in ipairs(currentMappings) do
			local oldId = mapping.oldId
			local newId = mapping.newId
			local pattern = "%f[%d]" .. oldId .. "%f[%D]"

			local count = 0
			newSource, count = string.gsub(newSource, pattern, newId)
			matchesFound += count
		end

		if matchesFound > 0 then
			local updateSuccess = pcall(function()
				ScriptEditorService:UpdateSourceAsync(scriptObj, function(oldContent)
					local content = oldContent

					for _, mapping in ipairs(currentMappings) do
						local pattern = "%f[%d]" .. mapping.oldId .. "%f[%D]"
						content = string.gsub(content, pattern, mapping.newId)
					end

					return content
				end)
			end)

			if updateSuccess then
				scriptsModified += 1
				referencesReplaced += matchesFound

				logMessage(
					"success",
					"Replaced " .. matchesFound .. " IDs in " .. scriptObj:GetFullName()
				)
			else
				scriptsSkipped += 1

				logMessage(
					"error",
					"Failed to update source: " .. scriptObj:GetFullName()
				)
			end
		end

		task.wait()
	end

	local elapsedTime = os.clock() - startTime

	logMessage("info", "Replacement process completed.")
	logMessage("success", "Scripts Modified: " .. scriptsModified)
	logMessage("info", "Scripts Skipped: " .. scriptsSkipped)
	logMessage("success", "References Replaced: " .. referencesReplaced)
	logMessage("info", string.format("Elapsed Time: %.2fs", elapsedTime))
	logMessage("info", "Thank you for using monetization reuploader!! ^o^ Contact : @91.45 (Discord)")
end

replaceBtn.MouseButton1Click:Connect(handleReplace)

logMessage("info", "Monetization Reuploader initialized!!! ^-^")